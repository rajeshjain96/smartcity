// import { isExpired } from "../licenseGuard";
export default function ListHeaders(props) {
  let { showInList } = props;
  let { sortedField } = props;
  let { direction } = props;
  let { cntShow } = props;
  function handleHeaderClick(index) {
    props.onHeaderClick(index);
  }
  // if (isExpired()) {
  //   return null;
  // }
  return (
    <>
      {showInList.map(
        (e, index) =>
          e.show && (
            <div
              className={
                cntShow >= 4 ? "col-2" : cntShow == 3 ? "col-3" : cntShow == 2 ? "col-6" : "col-5"
              }
              key={index}
            >
              <a
                href="#"
                className={`list-header-link ${sortedField == e.attribute ? "active" : ""}`}
                onClick={(event) => {
                  event.preventDefault();
                  handleHeaderClick(index);
                }}
              >
                <span className="list-header-text">
                  {e.label || e.attribute.charAt(0).toUpperCase() + e.attribute.slice(1)}
                </span>
                {sortedField == e.attribute && (
                  <span className="list-header-sort-icon">
                    {direction ? (
                      <i className="bi bi-arrow-up-short"></i>
                    ) : (
                      <i className="bi bi-arrow-down-short"></i>
                    )}
                  </span>
                )}
                {sortedField != e.attribute && (
                  <span className="list-header-sort-icon inactive">
                    <i className="bi bi-arrow-down-up"></i>
                  </span>
                )}
              </a>
            </div>
          )
      )}
    </>
  );
}
