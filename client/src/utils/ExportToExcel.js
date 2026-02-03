import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ExportToExcel = async (data, fileName = "export.xlsx") => {
  // Create worksheet from JSON data
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Create workbook and append the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Write workbook to binary buffer
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  // Save using file-saver
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, fileName);

  //   return <button onClick={exportFile}>Export to Excel</button>;
};

export default ExportToExcel;
