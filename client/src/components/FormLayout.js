// import { useIsMobile } from "../external/vite-sdk";
import { useIsMobile } from "../utils/useIsMobile";
export default function formLayout() {
  let cardStyle = `row bg-white p-4 rounded-4 shadow-sm border border-primary mb-3 `;
  let rowWidth = useIsMobile() ? "w-100" : "w-75";
  const cols =
    window.formLayout == "singleColumn"
      ? "col-12 col-md-7"
      : window.formLayout == "doubleColumns"
      ? "col-12 col-md-6"
      : "";
  cardStyle +=
    window.formLayout == "singleColumn"
      ? `${rowWidth} mx-auto myb`
      : window.formLayout == "doubleColumns"
      ? `${rowWidth}  mx-auto myb`
      : "";
  return { cardStyle, cols };
}
