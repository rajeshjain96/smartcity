import PDFGenerator from "./PDFGenerator";
//https://medium.com/@aalam-info-solutions-llp/creating-dynamic-pdfs-with-jspdf-and-customizing-autotables-in-react-a846a6f3fdca
export default function SamplePdfGenerator() {
  // Function to generate PDF when the button is clicked
  const generatePdf = () => {
    PDFGenerator();
  };

  // Render the main content
  return (
    <div
      style={{
        justifyContent: "center",
        display: "flex",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div>
        <p>Click here to download the PDF file.</p>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button onClick={generatePdf}></button>
        </div>
      </div>
    </div>
  );
}
