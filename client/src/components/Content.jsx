import { useEffect, useState } from "react";
import AddEditForm from "./AddEditForm";
import AnItem from "./AnItem";
import CommonUtilityBar from "./CommonUtilityBar";

export default function Content(props) {
  // let { categoryList } = props;
  let { selectedEntity } = props;
  let { selectedEntityIndex } = props;
  let { requiredLists } = props;
  let { itemToBeEdited } = props;
  let { formData } = props;
  let { emptyEntityObject } = props;
  let { emptyValidationsArray } = props;
  let { selectedList } = props;
  let { filteredList } = props;
  let { action } = props;
  let { message } = props;
  let { sortedField } = props;
  let { direction } = props;
  let { flagFormInvalid } = props;
  // let [attributes, setAttributes] = useState("");
  useEffect(() => {
    // let a = props.selectedEntity.attributes.map((e, index) => {
    //   if (index < 4) {
    //     e.selected = true;
    //   } else {
    //     e.selected = false;
    //   }
    //   return e;
    // });
    // setAttributes(a);
  }, []);
  function handleSubmit(obj) {
    props.onSubmit(obj);
  }
  function handleFormCloseClick() {
    props.onFormCloseClick();
  }
  function handleListClick() {
    props.onListClick();
  }
  function handleAddEntityClick() {
    props.onAddEntityClick();
  }
  function handleEditButtonClick(item) {
    props.onEditButtonClick(item);
  }
  function handleDeleteButtonClick(ans, item) {
    props.onDeleteButtonClick(ans, item);
  }
  function handleListCheckBoxClick(checked, index) {
    props.onListCheckBoxClick(checked, index);
  }
  function handleHeaderClick(index) {
    props.onHeaderClick(index);
  }
  function handleSrNoClick() {
    props.onSrNoClick();
  }
  function handleFormTextChangeValidations(message, index) {
    props.onFormTextChangeValidations(message, index);
  }
  function handleFileUploadChange(file, index) {
    props.onFileUploadChange(file, index);
  }
  function handleSearchKeyUp(event) {
    props.onSearchKeyUp(event);
  }
  function handleChangeImageClick(index) {
    props.onChangeImageClick(index);
  }
  function handleChangeImageCancelClick(index) {
    props.onChangeImageCancelClick(index);
  }
  return (
    <>
      <CommonUtilityBar
        action={action}
        message={message}
        onListClick={handleListClick}
        onAddEntityClick={handleAddEntityClick}
        onSearchKeyUp={handleSearchKeyUp}
        listLength={selectedList.length}
      />
      {filteredList.length == 0 && selectedList.length != 0 && (
        <div className="text-center">Nothing to show</div>
      )}
      {selectedList.length == 0 && (
        <div className="text-center">List is empty</div>
      )}
      {(action == "add" || action == "edit") && (
        <div className="row">
          <AddEditForm
            // attributes={selectedEntity.attributes}
            selectedEntity={selectedEntity}
            formData={formData}
            emptyEntityObject={emptyEntityObject}
            emptyValidationsArray={emptyValidationsArray}
            itemToBeEdited={itemToBeEdited}
            action={action}
            requiredLists={requiredLists}
            flagFormInvalid={flagFormInvalid}
            onSubmit={handleSubmit}
            onFormCloseClick={handleFormCloseClick}
            onFormTextChangeValidations={handleFormTextChangeValidations}
            onFileUploadChange={handleFileUploadChange}
            onChangeImageClick={handleChangeImageClick}
            onChangeImageCancelClick={handleChangeImageCancelClick}
          />
        </div>
      )}
      {action == "list" && filteredList.length != 0 && (
        <div className="row my-2 mx-auto border border-2 border-secondary p-1">
          {[
            ...Array(
              selectedEntity.attributes.length > 4
                ? 4
                : selectedEntity.attributes.length
            ),
          ].map((e, index) => (
            <div className="col-2" key={index}>
              <input
                type="checkbox"
                name=""
                id=""
                checked={selectedEntity.attributes[index].showInList}
                onChange={(e) => {
                  handleListCheckBoxClick(e.target.checked, index);
                }}
              />{" "}
              {selectedEntity.attributes[index].label}
            </div>
          ))}
        </div>
      )}
      {action == "list" && filteredList.length != 0 && (
        <div className="row justify-content-between my-2 mx-auto  p-1">
          {/* <div className="col-1">Sr.No.</div> */}
          <div className="col-1">
            <a
              href="#"
              // className={
              //   sortedField == selectedEntity.attributes[index].id
              //     ? " text-large text-danger"
              //     : ""
              // }
              onClick={() => {
                handleSrNoClick();
              }}
            >
              S N.{" "}
              {sortedField == "updateDate" && direction && (
                <i className="bi bi-arrow-up"></i>
              )}
              {sortedField == "updateDate" && !direction && (
                <i className="bi bi-arrow-down"></i>
              )}
            </a>
          </div>
          {[
            ...Array(
              selectedEntity.attributes.length > 4
                ? 4
                : selectedEntity.attributes.length
            ),
          ].map(
            (e, index) =>
              selectedEntity.attributes[index].showInList && (
                <div className={"col-2 "} key={index}>
                  <a
                    href="#"
                    className={
                      sortedField == selectedEntity.attributes[index].id
                        ? " text-large text-danger"
                        : ""
                    }
                    onClick={() => {
                      handleHeaderClick(index);
                    }}
                  >
                    {selectedEntity.attributes[index].label}{" "}
                    {sortedField == selectedEntity.attributes[index].id &&
                      direction && <i className="bi bi-arrow-up"></i>}
                    {sortedField == selectedEntity.attributes[index].id &&
                      !direction && <i className="bi bi-arrow-down"></i>}
                  </a>
                </div>
              )
          )}
          <div className="col-1">&nbsp;</div>
        </div>
      )}

      {action == "list" &&
        filteredList.map((e, index) => (
          <AnItem
            item={e}
            key={index + 1}
            index={index}
            sortedField={sortedField}
            direction={direction}
            listSize={filteredList.length}
            selectedEntity={selectedEntity}
            attributes={selectedEntity.attributes}
            onEditButtonClick={handleEditButtonClick}
            onDeleteButtonClick={handleDeleteButtonClick}
          />
        ))}
    </>
  );
}
