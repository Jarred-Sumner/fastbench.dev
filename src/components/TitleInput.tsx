export const TitleInput = ({ defaultValue, placeholder, onInput }) => {
  return (
    <div className="TitleInput-container">
      <input
        name={"title"}
        autoCapitalize="autoCapitalize"
        autoComplete={"off"}
        autoCorrect={"on"}
        className={"TitleInput"}
        placeholder={placeholder}
        autoFocus
        type={"text"}
        defaultValue={defaultValue}
        onInput={onInput}
      />
    </div>
  );
};