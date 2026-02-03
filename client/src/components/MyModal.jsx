import { useEffect } from "react";

export default function MyModal(props) {
  let { heading } = props;
  let { modalText } = props;
  let { btnGroup } = props;

  useEffect(() => {
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = "scroll";
    };
  }, []);
  function handleModalCloseClick() {
    props.onModalCloseClick();
  }
  function handleModalButtonClick(index) {
    props.onModalButtonClick(index);
  }
  return (
    <>
      <div className="modal-wrapper" onClick={handleModalCloseClick}></div>
      <div className="modal-container  ">
        <div className="text-bigger d-flex justify-content-between bg-primary text-white mb-3 p-2">
          {" "}
          <div>{heading}</div>{" "}
          <div onClick={handleModalCloseClick}>
            <i className="bi bi-x-square"></i>
          </div>
        </div>
        <div className="my-3 p-3"> {modalText}</div>
        <div className="text-center mb-3">
          {/* <button onClick={handleModalCloseClick}>Close</button> */}
          {btnGroup.map((e, index) => (
            <button
              className="btn btn-primary mx-1"
              key={index}
              onClick={() => {
                handleModalButtonClick(index);
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
