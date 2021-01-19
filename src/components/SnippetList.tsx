import * as React from "react";
import { SnippetContainer, SnippetRunState } from "./SnippetContainer";
import { Snippet } from "../lib/Snippet";
import { SharedIcon } from "./SharedIcon";
import { PlusIcon } from "./PlusIcon";
import { Result } from "src/components/ResultCard";
import classNames from "classnames";

const RankIcon = ({ rank }) => {
  return (
    <div
      className={classNames("SnippetIcon", "SnippetRank", {
        "SnippetRank--first": rank === 1,
      })}
    >
      #{rank}
    </div>
  );
};

export const SnippetList = ({
  runState,
  setRunState,
  focusedId,
  errors = [],
  setFocusedID,
  snippets,
  setSnippets,
  sharedSnippet,
  runner,
  showShared = true,
  setDirty,
  results = [],
}) => {
  const onChangeSharedSnippet = React.useCallback(
    (code) => (sharedSnippet.code = code),
    [sharedSnippet]
  );

  const updateCode = React.useCallback(
    (code: string, id: string) => {
      let snippet: Snippet;
      for (let _snippet of snippets) {
        if (_snippet.id === id) {
          snippet = _snippet;
          break;
        }
      }

      if (!snippet) {
        throw `Missing snippet for id ${id}`;
      }

      snippet.code = code;
      setRunState(SnippetRunState.pending);
      setDirty();
    },
    [snippets, setRunState, setDirty]
  );

  const updateTitle = React.useCallback(
    (title: string, id: string) => {
      let snippet: Snippet;
      for (let _snippet of snippets) {
        if (_snippet.id === id) {
          snippet = _snippet;
          break;
        }
      }

      if (!snippet) {
        throw `Missing snippet for id ${id}`;
      }

      snippet.name = title;
    },
    [snippets]
  );

  const addSnippet = React.useCallback(() => {
    setSnippets((snippets) => {
      const _snippets = snippets.slice();

      _snippets.push(Snippet.create());
      return _snippets;
    });
    setRunState(SnippetRunState.pending);
  }, [setSnippets, Snippet.create, setRunState]);

  const removeSnippet = React.useCallback(
    (snippetId) => {
      setSnippets((snippets) => {
        const _snippets = snippets.slice();

        _snippets.splice(
          snippets.findIndex((snippet) => snippet.id === snippetId),
          1
        );
        return _snippets;
      });
      setRunState(SnippetRunState.pending);
    },
    [setSnippets, Snippet.create, setRunState]
  );

  const progressUpdateRefs = React.useMemo(() => {
    return [
      snippets.map(() => React.createRef()),
      snippets.map(() => React.createRef()),
    ];
  }, [snippets, snippets.length]);

  React.useLayoutEffect(() => {
    runner.progressBarRefs = progressUpdateRefs[0];
    runner.opsRefs = progressUpdateRefs[1];
  }, [progressUpdateRefs, runner]);

  const renderSnippetContainer = React.useCallback(
    (snippet: Snippet, index: number) => {
      let result: Result, baseline;
      if (results?.length) {
        for (let i = 0; i < results.length && (!baseline || !result); i++) {
          const _result = results[i];

          if (_result.id === snippet.id) {
            result = _result;
          }
        }
      }

      return (
        <SnippetContainer
          key={snippet.id + "-" + focusedId + "-" + index}
          title={snippet.name}
          placeholder={"Untitled snippet"}
          progressUpdateRef={progressUpdateRefs[0][index]}
          overlayRef={progressUpdateRefs[1][index]}
          onChangeTitle={updateTitle}
          result={result}
          error={errors[index]}
          focusedId={focusedId}
          onFocus={setFocusedID}
          onBlur={setFocusedID}
          code={snippet.code}
          onDelete={snippets.length > 1 ? removeSnippet : null}
          runState={runState}
          codePlaceholder={"Insert JavaScript benchmark code in here."}
          onChangeCode={updateCode}
          id={snippet.id}
          icon={
            result ? (
              <RankIcon rank={result.rank} />
            ) : (
              <SnippetIndexIcon>
                {String.fromCharCode((index % 26) + 65)}
              </SnippetIndexIcon>
            )
          }
        />
      );
    },
    [
      snippets.length,
      snippets,
      focusedId,
      results,

      errors,
      removeSnippet,
      errors.length,
      results.length,
      updateCode,
      setFocusedID,
      updateTitle,
      progressUpdateRefs,
      runState,
    ]
  );

  return (
    <div className={"SnippetList"}>
      {showShared && (
        <SnippetContainer
          disableTitle
          icon={<SharedIcon className={"SnippetIcon"} />}
          placeholder={"Shared code"}
          code={sharedSnippet.code}
          onChangeCode={onChangeSharedSnippet}
          codePlaceholder={
            "Insert JavaScript code that runs before all benchmarks in here"
          }
        />
      )}

      {snippets.map(renderSnippetContainer)}

      {setSnippets && <NewSnippetButton onClick={addSnippet} />}
    </div>
  );
};

const SnippetIndexIcon = ({ children }) => (
  <div className={"SnippetIcon SnippetIndexIcon"}>{children}</div>
);

const NewSnippetButton = ({ onClick }) => (
  <div onClick={onClick} className={"NewSnippetContainer"}>
    <PlusIcon className={"SnippetIcon NewSnippetContainer-icon"} />

    <div className={"NewSnippetContainer-label"}>ADD SNIPPET</div>
  </div>
);
