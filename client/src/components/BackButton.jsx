export default function BackButton(props) {
  function handleBackButtonClick() {
    props.onBackButtonClick();
  }
  return (
    <button className="btn btn-secondary mb-1" onClick={handleBackButtonClick} style={{fontSize:"10px"}}>
      &larr; Back to Home
    </button>
  );
}
