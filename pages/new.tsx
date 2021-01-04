import { PageHeader } from "../src/components/PageHeader";
import { SnippetContainer } from "../src/components/SnippetContainer";
import { TitleInput } from "../src/components/TitleInput";
import * as React from "react";
import { FakeLinkButton } from "../src/components/LinkButton";
import { SharedIcon } from "../src/components/SharedIcon";
import { PlusIcon } from "../src/components/PlusIcon";

enum SnippetType {
  shared,
  code,
  placeholder,
}

type Snippet = {
  id?: string;
  code: string;
  name: string;
  type: SnippetType;
};

const baseSnippetObject: Snippet = {
  id: null,
  code: "",
  name: "",
  type: SnippetType,
};

function createSnippet(type: SnippetType) {
  const snippet = Object.create(baseSnippetObject);
  snippet.code = "";
  snippet.name = "";
  snippet.id = Math.random().toString(16);
  snippet.type = type;
  return snippet;
}

function createSharedSnippet() {
  const snippet = Object.create(baseSnippetObject);
  snippet.type = SnippetType.shared;
  snippet.code = "";
  snippet.id = Math.random().toString(16);
  snippet.name = "";
  return snippet;
}

const placeholderSnippet = createSnippet(SnippetType.placeholder);

const SnippetIndexIcon = ({ children }) => (
  <div className={"SnippetIcon SnippetIndexIcon"}>{children}</div>
);

const NewSnippetButton = ({ onClick }) => (
  <div onClick={onClick} className={"NewSnippetContainer"}>
    <PlusIcon className={"SnippetIcon NewSnippetContainer-icon"} />

    <div className={"NewSnippetContainer-label"}>ADD SNIPPET</div>
  </div>
);

export const NewBenchmarkPage = () => {
  const [title, setTitle] = React.useState("");
  const [focusedId, setFocusedID] = React.useState(null);
  const handleTitleChangeEvent = React.useCallback(
    (event: React.SyntheticEvent<InputEvent, HTMLInputElement>) => {
      setTitle(event.target.value);
    },
    [setTitle]
  );

  const [sharedSnippet, setSharedSnippet] = React.useState(() =>
    createSharedSnippet()
  );

  const [snippets, setSnippets] = React.useState(() => [
    createSnippet(SnippetType.code),
  ]);

  const updateCode = React.useCallback(
    (code: string, snippet: Snippet) => {
      snippet.code = code;
    },
    [snippets, sharedSnippet]
  );

  const addSnippet = React.useCallback(() => {
    setSnippets((snippets) => {
      const _snippets = snippets.slice();

      _snippets.push(createSnippet(SnippetType.code));
      return _snippets;
    });
  }, [setSnippets, createSnippet]);

  const renderSnippetContainer = React.useCallback(
    (snippet: Snippet, index: number) => {
      return (
        <SnippetContainer
          key={snippet.id + "-" + focusedId}
          title={snippet.name}
          placeholder={"Untitled snippet"}
          focusedId={focusedId}
          onFocus={setFocusedID}
          onBlur={setFocusedID}
          code={snippet.code}
          codePlaceholder={"Insert JavaScript benchmark code in here."}
          onChangeCode={updateCode}
          id={snippet.id}
          icon={
            <SnippetIndexIcon>
              {String.fromCharCode((index % 26) + 65)}
            </SnippetIndexIcon>
          }
        />
      );
    },
    [snippets.length, snippets, focusedId, updateCode, setFocusedID]
  );

  return (
    <div className={"Page NewBenchmarkPage"}>
      <PageHeader />

      <div className={"NewBenchmarkPageContent"}>
        <div className={"BenchmarkHeader"}>
          <TitleInput
            placeholder={"UNTITLED BENCHMARK"}
            defaultValue={""}
            onInput={handleTitleChangeEvent}
          />

          <div className={"RunTestButtonContainer"}>
            <FakeLinkButton>Run test</FakeLinkButton>
          </div>
        </div>

        <div className={"SnippetList"}>
          <SnippetContainer
            disableTitle
            icon={<SharedIcon className={"SnippetIcon"} />}
            placeholder={"Shared code"}
            codePlaceholder={
              "Insert JavaScript code that runs before all benchmarks in here"
            }
          />

          {snippets.map(renderSnippetContainer)}

          <NewSnippetButton onClick={addSnippet} />
        </div>
      </div>
    </div>
  );
};

export default NewBenchmarkPage;