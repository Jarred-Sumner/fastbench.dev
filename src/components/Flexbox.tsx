import {
  Allocator,
  Node,
  AlignItems,
  AlignSelf,
  AlignContent,
  Direction,
  Display,
  FlexDirection,
  JustifyContent,
  Overflow,
  PositionType,
  FlexWrap,
  Layout,
} from "stretch-layout";
import * as React from "react";

const replacementKeys = ["x", "y", "width", "height", "start", "end"];

function findParent(
  childrenMap: Map<Node, Node[]>,
  child: Node
): [Node, number] {
  for (let [parentNode, children] of childrenMap.entries()) {
    if (children.includes(child)) {
      return [parentNode, children.indexOf(child)];
    }
  }
  return [null, null];
}

const PositionContext = React.createContext({
  x: 0,
  y: 0,
});

const FlexChild = ({
  width,
  height,
  x: _x,
  y: _y,
  props: _props,
  ElementType,
  children,
}) => {
  const { yoga, ...props } = _props;

  const position = React.useContext(PositionContext);
  const x = position.x + _x;
  const y = position.y + _y;

  return (
    <ElementType {...props} width={width} height={height} x={x} y={y}>
      <PositionContext.Provider value={{ x, y }}>
        {children}
      </PositionContext.Provider>
    </ElementType>
  );
};
export const Flexbox = ({ children: _children, style, width, height }) => {
  let children = _children;
  const allocator = React.useRef<Allocator>();
  const nodeMap = React.useRef<Map<Symbol, Node>>();
  const layoutMap = React.useRef<Map<Symbol, Layout>>();
  const nodeChildren = React.useRef<Map<Node, Node[]>>();
  const rootNodes = React.useRef<Node[]>([]);
  const rootNode = React.useRef<Node>();

  const calculcateStyles = React.useCallback(
    (_child: React.ReactChild, index: number, isRoot: boolean = false) => {
      let child = _child;
      if (typeof child?.type === "function") {
        child = child.type(child.props);
      }
      if (!allocator.current) {
        allocator.current = new Allocator();
        nodeMap.current = new Map<Symbol, Node>();
        nodeChildren.current = new Map();
        rootNode.current = new Node(allocator.current, style);
      }

      let styleProp = typeof child === "object" &&
        child?.props?.yoga && { ...child?.props?.yoga };

      if (typeof child === "object") {
        if (!styleProp) {
          styleProp = {};
        }

        for (let key of replacementKeys) {
          if (
            child.props[key] &&
            ((typeof child.props[key] === "number" &&
              Number.isFinite(child.props[key])) ||
              typeof child.props[key] === "string")
          ) {
            styleProp[key] = child.props[key];
          }
        }
      }
      const hasChildren = React.Children.count(child?.props?.children) > 0;

      // console.log(child.type);
      if (styleProp) {
        let node: Node;

        node = new Node(allocator.current, styleProp);

        if (isRoot) {
          if (!nodeChildren.current.get(rootNode.current)) {
            nodeChildren.current.set(rootNode.current, []);
          }
          nodeChildren.current.get(rootNode.current).push(node);
          rootNode.current.addChild(node);
          nodeChildren.current.set(node, []);
        } else {
          nodeChildren.current.set(node, []);
        }

        let childNodes = nodeChildren.current.get(node);
        const yogaID = Symbol();
        nodeMap.current.set(yogaID, node);

        let children = child?.props?.children;

        if (hasChildren) {
          children = React.Children.map(
            child.props.children,
            (child, index) => {
              const childNode = calculcateStyles(child, index, false);

              if (childNode?.props?.yogaID) {
                const _childNode = nodeMap.current.get(
                  childNode?.props?.yogaID
                );
                node.addChild(_childNode);
                childNodes.push(_childNode);
              }

              return childNode;
            }
          );
        }

        child = React.cloneElement(
          child,
          { ...child.props, yogaID, children: null },
          children
        );

        return child;
      }

      return child;
    },
    [allocator, nodeMap, rootNodes, nodeChildren, style, rootNode]
  );

  const applyStyles = React.useCallback(
    (child: React.ReactChild, index: number) => {
      const yogaID = child?.props?.yogaID;

      if (typeof child === "object" && layoutMap.current.has(yogaID)) {
        let layout = layoutMap.current.get(yogaID);
        let found = true;

        const _children = React.Children.map(child.props.children, applyStyles);

        // if (typeof child.type === "function" && child.type !== FlexChild) {
        //   debugger;
        // }

        return (
          <FlexChild
            width={layout.width}
            height={layout.height}
            x={layout.x}
            y={layout.y}
            props={child.props}
            ElementType={child.type}
          >
            {_children}
          </FlexChild>
        );
      } else if (yogaID) {
        debugger;
      }

      if (typeof child === "string") {
        return child;
      }

      if (typeof child === "function") {
        debugger;
      }

      return child;
    },
    [allocator, layoutMap, nodeChildren, rootNode, nodeChildren, nodeMap]
  );

  children = React.Children.map(children, (child, index) => {
    return calculcateStyles(child, index, true);
  });

  rootNode.current.markDirty();

  const layout = rootNode.current.computeLayout({ width, height });
  layoutMap.current = new Map();
  let i = 0;
  for (let child of nodeChildren.current.get(rootNode.current)) {
    for (let [_el, node] of nodeMap.current.entries()) {
      if (node === child) {
        layoutMap.current.set(_el, layout.child(i++));
        break;
      }
    }
  }

  function mergeLayoutMap(child: React.ReactChild, index) {
    // TODO: make this a reversible map, i.e. keys and values both are .get-able
    // That would remove this o(n^2) loop...
    const yogaID = child?.props?.yogaID;

    if (nodeMap.current.has(yogaID)) {
      const [parentNode, index] = findParent(
        nodeChildren.current,
        nodeMap.current.get(yogaID)
      );

      for (let [parentEl, node] of nodeMap.current.entries()) {
        if (node === parentNode) {
          if (layoutMap.current.has(parentEl)) {
            const parentLayout = layoutMap.current.get(parentEl);
            layoutMap.current.set(yogaID, parentLayout.child(index));
          }
          break;
        }
      }
    }

    const hasChildren = React.Children.count(child?.props?.children) > 0;

    if (hasChildren) {
      React.Children.forEach(child.props.children, mergeLayoutMap);
    }
  }

  React.Children.forEach(children, mergeLayoutMap);

  const result = React.Children.map(children, applyStyles);

  console.assert(
    nodeMap.current.size === layoutMap.current.size,
    "Missing layout for nodes"
  );

  if (allocator.current) {
    for (let node of nodeMap.current.values()) {
      node.free();
    }

    allocator.current.free();
    allocator.current = null;
    layoutMap.current = null;
    nodeMap.current.clear();
    nodeChildren.current.clear();
    rootNodes.current.length = 0;
    rootNode.current = null;
  }

  return (
    <PositionContext.Provider value={{ x: layout.x, y: layout.y }}>
      {result}
    </PositionContext.Provider>
  );
};

export default Flexbox;
