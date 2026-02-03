import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
export default function ExportToPDF(
  selectedEntityName,
  fieldsToBeExported,
  exportList,
  fileName
) {
  const data = [...exportList];
  let headers = [];
  let body = data.map((row, index) => {
    console.log(row);
    let a = [];
    for (let i = 0; i < fieldsToBeExported.length; i++) {
      console.log(row[fieldsToBeExported[i]]);
      a.push(row[fieldsToBeExported[i]].toString());
    } //for
    return a;
  });
  // Make first letter of headers capital
  fieldsToBeExported = fieldsToBeExported.map((e, index) => {
    let s = e.charAt(0).toUpperCase() + e.slice(1);
    return s;
  });
  // now push to headers
  headers.push(fieldsToBeExported);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "A4",
  });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Logo (optional)
  const logo = new Image();
  logo.src = "/images/Mobico_Logo.png";
  logo.onload = () => {
    doc.addImage(logo, "JPEG", pageWidth - 140, 20, 100, 50);
    doc.setFontSize(18);
    doc.text(selectedEntityName + " Data", 40, 50);
    doc.setFontSize(12);
    doc.text("Generated on: " + new Date().toLocaleDateString(), 40, 70);

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 100,
      theme: "grid",
      headStyles: { fillColor: [0, 102, 204], textColor: 255 },
      bodyStyles: { fillColor: [245, 245, 245] },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 6 },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(9);
        doc.text(
          `Page ${
            doc.internal.getCurrentPageInfo().pageNumber
          } of ${pageCount}`,
          pageWidth - 100,
          pageHeight - 20
        );
      },
    });
    // let fileName = selectedEntity.name + " " + new Date() + ".pdf";
    // doc.save("hidden-table.pdf");
    doc.save(fileName);
  };
}
