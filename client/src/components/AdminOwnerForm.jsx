import { useEffect, useState } from "react";
import { fieldValidate } from "../external/vite-sdk";
import "../formstyles.css";
import { SingleFileUpload } from "../external/vite-sdk";
import formLayout from "./FormLayout";
export default function AdminOwnerForm(props) {
  let fl = formLayout();
  let cardStyle = fl.cardStyle;
  let cols = fl.cols;
  let [owner, setOwner] = useState("");
  let [errorOwner, setErrorOwner] = useState(props.ownerValidations);
  let [flagFormInvalid, setFlagFormInvalid] = useState(false);
  let { emptyOwner } = props;
  let { ownerToBeEdited } = props;
  let { action } = props;
  let { selectedEntity } = props;
  let { ownerSchema } = props;
  let [singleFileList, setSingleFileList] = useState(
    getSingleFileListFromOwnerSchema()
  );
  function getSingleFileListFromOwnerSchema() {
    let list = [];
    ownerSchema.forEach((e, index) => {
      let obj = {};
      if (e.type == "singleFile") {
        obj["fileAttributeName"] = e.attribute;
        obj["allowedFileType"] = e.allowedFileType;
        obj["allowedSize"] = e.allowedSize;
        list.push(obj);
      }
    });
    return list;
  }
  useEffect(() => {
    window.scroll(0, 0);
    init();
  }, []);
  function init() {
    let { action } = props;
    if (action === "add") {
      // emptyOwner.category = props.categoryToRetain;
      // emptyOwner.categoryId = props.categoryIdToRetain;
      setOwner(props.emptyOwner);
    } else if (action === "update") {
      // in edit mode, keep the update button enabled at the beginning
      setFlagFormInvalid(false);
      // find missing keys
      const missing = Object.keys(emptyOwner).filter(
        (key) => !Object.keys(ownerToBeEdited).includes(key)
      );
      // add them to objB with empty string
      missing.forEach((key) => {
        ownerToBeEdited[key] = "";
      });
      setOwner(props.ownerToBeEdited);
    }
  }
  function handleTextFieldChange(event) {
    let name = event.target.name;
    setOwner({ ...owner, [name]: event.target.value });
    let message = fieldValidate(event, errorOwner);
    let errOwner = { ...errorOwner };
    errorOwner[`${name}`].message = message;
    setErrorOwner(errOwner);
  }
  function handleBlur(event) {
    let name = event.target.name;
    let message = fieldValidate(event, errorOwner);
    let errOwner = { ...errorOwner };
    errorOwner[`${name}`].message = message;
    setErrorOwner(errOwner);
  }
  function handleFocus(event) {
    setFlagFormInvalid(false);
  }
  function handleRadioFieldChange(event) {
    let name = event.target.name;
    setOwner({ ...owner, [name]: event.target.value });
  }
  function handleCheckBoxChange(event) {
    const { name, value, checked } = event.target;
    if (checked) {
      // Add value to array for that name
      setOwner({ ...owner, [name]: [...owner[`${name}`], value] });
    } else {
      // Remove value from array for that name
      setOwner({
        ...owner,
        [name]: owner[`${name}`].filter((e) => e !== value),
      });
    }
  }
  function checkAllErrors() {
    for (let field in errorOwner) {
      if (errorOwner[field].message !== "") {
        return true;
      } //if
    } //for
    let errOwner = { ...errorOwner };
    let flag = false;
    for (let field in owner) {
      if (errorOwner[field] && owner[field] == "") {
        flag = true;
        errOwner[field].message = "Required...";
      } //if
    } //for
    if (flag) {
      setErrorOwner(errOwner);
      return true;
    }
    return false;
  }
  const handleFormSubmit = (e) => {
    e.preventDefault();
    // for dropdown, data is to be modified
    // first check whether all entries are valid or not
    if (checkAllErrors()) {
      setFlagFormInvalid(true);
      return;
    }
    setFlagFormInvalid(false);
    if (action == "update") {
      // There might be files in this form, add those also
      let pr = { ...owner };
      for (let i = 0; i < singleFileList.length; i++) {
        let fAName = singleFileList[i].fileAttributeName;
        if (pr[fAName + "New"]) {
          // image is modified
          // if field-name is image, temporarily in "imageNew" field, new file-name is saved.
          pr[fAName] = pr[fAName + "New"];
          delete pr[fAName + "New"];
        }
      } //for
      setOwner(pr);
      props.onFormSubmit(pr);
    } else if (action == "add") {
      props.onFormSubmit(owner);
    }
  };
  function handleFileChange(selectedFile, fileIndex, message) {
    setFlagFormInvalid(false);
    if (action == "add") {
      // add datesuffix to file-name
      const timestamp = Date.now();
      const ext = selectedFile.name.split(".").pop();
      const base = selectedFile.name.replace(/\.[^/.]+$/, "");
      const newName = `${base}-${timestamp}.${ext}`;
      // Create a new File object with the new name
      const renamedFile = new File([selectedFile], newName, {
        type: selectedFile.type,
        lastModified: selectedFile.lastModified,
      });
      setOwner({
        ...owner,
        ["file" + fileIndex]: renamedFile,
        [singleFileList[fileIndex].fileAttributeName]: newName,
      });
      let errOwner = { ...errorOwner };
      errOwner[singleFileList[fileIndex].fileAttributeName].message = message;
      setErrorOwner(errOwner);
      // setErrorOwner({ ...errorOwner, message: message });
    }
  }
  function handleFileRemove(selectedFile, fileIndex, message) {
    if (action == "add") {
      setFlagFormInvalid(false);
      setOwner({
        ...owner,
        [singleFileList[fileIndex].fileAttributeName]: "",
      });
      let errOwner = { ...errorOwner };
      errOwner[singleFileList[fileIndex].fileAttributeName].message = message;
      setErrorOwner(errOwner);
    } else if (action == "update") {
      let newFileName = "";
      if (selectedFile) {
        newFileName = selectedFile.name;
      } else {
        // user selected a new file but then deselected
        newFileName = "";
      }
      setOwner({
        ...owner,
        ["file" + fileIndex]: selectedFile,
        [singleFileList[fileIndex].fileAttributeName + "New"]: newFileName,
      });
      let errOwner = { ...errorOwner };
      errOwner[singleFileList[fileIndex].fileAttributeName].message = message;
      setErrorOwner(errOwner);
    }
  }
  function handleFileChangeUpdateMode(selectedFile, fileIndex, message) {
    let newFileName = "";
    if (selectedFile) {
      newFileName = selectedFile.name;
    } else {
      // user selected a new file but then deselected
      newFileName = "";
    }
    setOwner({
      ...owner,
      // file: file,
      ["file" + fileIndex]: selectedFile,
      [singleFileList[fileIndex].fileAttributeName + "New"]: newFileName,
      // [singleFileList[fileIndex].fileAttributeName]: selectedFile.name,
    });
    let errOwner = { ...errorOwner };
    errOwner[singleFileList[fileIndex].fileAttributeName].message = message;
    setErrorOwner(errOwner);
  }
  function handleCancelChangeImageClick() {
    if (action == "update") {
      let fl = [...singleFileList];
      fl[fileIndex]["newFileName"] = "";
      fl[fileIndex]["newFile"] = "";
      setSingleFileList(fl);
    }
  }
  function handleSelectCategoryChange(event) {
    let category = event.target.value.trim();
    let categoryId = event.target.selectedOptions[0].id;
    setOwner({ ...owner, category: category, categoryId: categoryId });
  }
  return (
    <div>
      <form className="text-thick p-4" onSubmit={handleFormSubmit}>
        {/* row starts */}
        <div className={`${cardStyle}`}>
          
      <div className={cols +" my-2"}>
      <div className="text-bold my-1">
      <label className="form-label fw-semibold">Email Id</label>
      </div>
      <div className=" px-0">
      <input
      type="email"
      className="form-control"
      name="emailId"
      value={owner.emailId}
      onChange={handleTextFieldChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder="Enter emailId"
      />
      </div>
      <div className="">
      {errorOwner.emailId.message ? (
                <span className="text-danger">{errorOwner.emailId.message}</span>
                ) : null}
                </div>
                </div>
        <div className={cols + " my-2"}>
        <div className="text-bold my-1">
        <label className="form-label fw-semibold">Role</label>
        </div>
        <div className="px-0">
        <select
        className="form-control"
        name="role"
        value={owner.role}
        onChange={(e) =>
                  setOwner({ ...owner, role: e.target.value })
                }
        onBlur={handleBlur}
        onFocus={handleFocus}
        >
        <option value="">-- Select role --</option>
        
        <option value="owner" id="0">
        owner
        </option>
        
        <option value="staff" id="1">
        staff
        </option>
        </select></div>
          </div>
          
          <div className={cols + " my-2"}>
        <div className="text-bold my-1">
        <label className="form-label fw-semibold">Status</label>
        </div>
        <div className="px-0"><input
        type="radio"
        name="status"
        value="waiting"
        onChange={handleRadioFieldChange}
        onBlur={handleBlur}
        onFocus={handleFocus}      
        checked={owner.status == "waiting"}
        />&nbsp;waiting&nbsp;<input
        type="radio"
        name="status"
        value="enabled"
        onChange={handleRadioFieldChange}
        onBlur={handleBlur}
        onFocus={handleFocus}      
        checked={owner.status == "enabled"}
        />&nbsp;enabled&nbsp;<input
        type="radio"
        name="status"
        value="disabled"
        onChange={handleRadioFieldChange}
        onBlur={handleBlur}
        onFocus={handleFocus}      
        checked={owner.status == "disabled"}
        />&nbsp;disabled&nbsp;</div>
          </div>
          
          <div className="col-12">
            <button
              className="btn btn-primary"
              type="submit"
              // disabled={flagFormInvalid}
            >
              {(action + " " + selectedEntity.singularName).toUpperCase()}
            </button>{" "}
            &nbsp;{" "}
            <span className="text-danger">
              {" "}
              {flagFormInvalid ? "Missing data.." : ""}
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
