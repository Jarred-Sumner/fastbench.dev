import { resolveSkypackModule, Result, skypackURL } from "src/skypack";
import useSWR from "swr";
import * as React from "react";
import { Portal } from "react-portal";
import { useMeasure } from "react-use";
const FIXED_SIZE = { display: "block", width: 1, height: 1, content: "" };

const DEFAULT_LIST = [
  {
    createdAt: "2012-04-23T16:37:11.912Z",
    description: "Lodash modular utilities.",
    hasTypes: true,
    isDeprecated: false,
    maintainers: "[{…}, {…}, {…}]",
    name: "lodash",
    popularityScore: 0.9399038528174617,
    projectType: "other",
    updatedAt: "2021-01-04T09:59:18.034Z",
  },
  {
    createdAt: "2014-10-06T12:10:33.939Z",
    description: "Modern JavaScript date utility library",
    hasTypes: true,
    isDeprecated: false,
    maintainers: [
      { name: "kossnocorp", email: "kossnocorp@gmail.com" },
      { name: "leshakoss", email: "regiusprod@gmail.com" },
    ],
    name: "date-fns",
    popularityScore: 0.6400365390955896,
    projectType: "other",
    updatedAt: "2020-08-31T14:28:29.755Z",
  },
  {
    createdAt: "2014-11-05T01:18:18.680Z",
    description:
      "A simple utility for conditionally joining classNames together",
    hasTypes: true,
    isDeprecated: false,
    maintainers: [{ name: "jedwatson", email: "jed.watson@me.com" }],
    name: "classnames",
    popularityScore: 0.765397240340734,
    projectType: "other",
    updatedAt: "2020-10-08T03:31:59.713Z",
  },
  {
    createdAt: "2014-05-16T17:40:23.089Z",
    description: "A practical functional library for JavaScript programmers.",
    hasTypes: true,
    isDeprecated: false,
    maintainers: [
      { email: "aromano@preemptsecurity.com", name: "aromano" },
      { email: "notpmoc84@hotmail.com", name: "bradcomp" },
      { email: "m_hur@yahoo.com", name: "buzzdecafe" },
      { email: "scott@sauyet.com", name: "crosseye" },
      { email: "dc@davidchambers.me", name: "davidchambers" },
      { email: "kwallace@gmail.com", name: "kedashoe" },
      { email: "raine.virta@gmail.com", name: "rane" },
      { email: "schristopher@konputa.com", name: "scott-christopher" },
    ],
    name: "ramda",
    popularityScore: 0.6496638770701231,
    projectType: "other",
    updatedAt: "2020-07-30T08:43:47.265Z",
  },
];

const initialData = {
  results: DEFAULT_LIST,
};

const ModuleListItem = ({
  item,
  onClick,
}: {
  item: Result;
  onClick: Function;
}) => {
  const isLoading = React.useRef(false);
  const isCancelled = React.useRef(false);
  const processRequest = React.useCallback(
    async (name: string) => {
      isLoading.current = true;
      const url = await resolveSkypackModule(name);
      isLoading.current = false;
      if (!isCancelled.current) {
        onClick(name, url);
      }
    },
    [onClick, resolveSkypackModule, isLoading]
  );
  const _onClick = React.useCallback(
    (event) => {
      event.stopPropagation();
      event.preventDefault();
      event.nativeEvent.stopPropagation();
      event.nativeEvent.preventDefault();

      if (isLoading.current) {
        return;
      }

      const name = item.name;
      return processRequest(name);
    },
    [processRequest, isLoading]
  );

  React.useEffect(() => {
    return () => {
      isCancelled.current = true;
    };
  }, [isCancelled]);

  return (
    <div onMouseDown={_onClick} className="ModuleListItem">
      <div className="ModuleListItem-info">
        <div className="ModuleListItem-name">{item.name}</div>
        <div className="ModuleListItem-description">{item.description}</div>
      </div>

      <div className="ModuleListItem-importButton">Import</div>
    </div>
  );
};

const fetcher = (key, query: string) => {
  if (query.trim() === "") {
    return initialData;
  }

  return skypackURL(query);
};

function useOutsideAlerter(
  ref: React.RefObject<HTMLDivElement>,
  onClickOutside,
  isClosed
) {
  React.useLayoutEffect(() => {
    /**
     * Alert if clicked on outside of element
     */
    function handleClickOutside(event: MouseEvent) {
      if (isClosed.current) {
        return;
      }

      if (ref.current && !ref.current.contains(event.target)) {
        event.preventDefault();
        event.stopPropagation();
        onClickOutside();
      }
    }
    // Bind the event listener
    document.addEventListener("mouseup", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mouseup", handleClickOutside);
    };
  }, [ref, onClickOutside, isClosed]);
}

const ESCAPE_KEYCODE = 27;

function cancelEvent(event: React.MouseEvent) {
  event.stopPropagation();
  event.preventDefault();
  event.nativeEvent.stopPropagation();
  event.nativeEvent.stopImmediatePropagation();
}

export const ModulePicker = ({ onClose, onPick }) => {
  const isClosed = React.useRef(false);
  const [query, setQuery] = React.useState("");
  const { data, error } = useSWR(["/skypack-search", query], fetcher, {
    dedupingInterval: 20,
    initialData: null,
  });
  const onChangeQuery = React.useCallback(
    (event: React.ChangeEvent) => {
      setQuery(event.target.value);
    },
    [setQuery]
  );

  const renderModuleListItem = React.useCallback(
    (item: Result, index: number) => {
      return <ModuleListItem item={item} key={item.name} onClick={onPick} />;
    },
    [onPick]
  );

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.keyCode) {
        case ESCAPE_KEYCODE: {
          onClose();
          isClosed.current = true;
          event.preventDefault();
          break;
        }
      }
    },
    [onClose, isClosed]
  );
  React.useEffect(() => {
    return () => {
      isClosed.current = true;
    };
  }, [isClosed]);

  const ref = React.useRef();

  useOutsideAlerter(ref, onClose, isClosed);
  const _onClose = React.useCallback(
    (event: React.MouseEvent) => {
      if (event.isDefaultPrevented()) {
        return;
      }

      onClose(event);
    },
    [onClose]
  );

  const body = React.useRef(document.body);

  const parentRef = React.useRef<HTMLDivElement>();

  const [top, setTop] = React.useState(Infinity);
  const [right, setRight] = React.useState(Infinity);

  React.useLayoutEffect(() => {
    if (parentRef.current) {
      const rect = parentRef.current.getBoundingClientRect();
      const rightRect = document.body
        .querySelector(".SnippetList")
        .getBoundingClientRect();
      setTop(rect.top - 34);
      setRight(16);
    }
  }, [parentRef, setTop, setRight]);

  const position = React.useMemo(
    () => ({
      top,
      right,
      visibility: Number.isFinite(top) ? "visible" : "hidden",
    }),
    [top, right]
  );

  const inputRef = React.useRef<HTMLInputElement>();
  const hasFocused = React.useRef(false);

  React.useLayoutEffect(() => {
    if (!hasFocused.current && position.visibility === "visible") {
      inputRef.current.focus();
      hasFocused.current = true;
    }
  }, [position, inputRef, hasFocused]);

  React.useLayoutEffect(() => {
    document.body.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  return (
    <span style={FIXED_SIZE} ref={parentRef}>
      <Portal>
        <div style={position} className="ModulePickerModal" ref={ref}>
          <div onMouseUp={cancelEvent} className="ModulePicker">
            <input
              type="search"
              autoFocus
              ref={inputRef}
              className="ModulePicker-search"
              defaultValue={query}
              onChange={onChangeQuery}
              placeholder="Search NPM"
            />

            {data?.results?.length === 0 && (
              <div className="ModuleListContainer-empty">
                <div className="ModuleListContainer-emptyText">
                  No results for {query}
                </div>
              </div>
            )}

            {data?.results?.length > 0 && (
              <div className="ModuleListContainer">
                {data.results.map(renderModuleListItem)}
              </div>
            )}
          </div>
        </div>
      </Portal>
    </span>
  );
};
