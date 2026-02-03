import { useEffect } from "react";
export default function Modal(props) {
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
    props.onModalButtonClick(btnGroup[index]);
  }
  return (
    <>
      <div className="modal-wrapper" onClick={handleModalCloseClick} style={{ zIndex: 1040 }}></div>
      <div className="modal-container  " onClick={(e) => e.stopPropagation()}>
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
