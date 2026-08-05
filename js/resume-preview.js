// resume-preview.js
import pdfjsLib from "./lib/pdf.js";

console.log("pdfjsLib object:", pdfjsLib);
console.log("getDocument:", pdfjsLib.getDocument);

window.addEventListener("load", () => {
    const canvas = document.getElementById("pdf-render");
    const loadingIndicator = document.querySelector(".loading-indicator");
    const ctx = canvas.getContext("2d");

    function displayError(message) {
        loadingIndicator.innerHTML = `
            <p>${message}</p>
            <p>Please try downloading the file directly.</p>
        `;
    }

    const url = "/resume/Dillan-Suon-Resume.pdf";

    console.log("pdfjsLib:", pdfjsLib);
    console.log("url:", url);
    console.log("getDocument:", pdfjsLib.getDocument);

    pdfjsLib
        .getDocument({url})
        .promise
        .then((pdfDoc) => pdfDoc.getPage(1))
        .then((page) => {
            const container = canvas.parentElement;

            const desiredWidth = container.clientWidth - 30;

            const viewport = page.getViewport({ scale: 1.0 });

            const scale = desiredWidth / viewport.width;

            const scaledViewport = page.getViewport({ scale });

            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;

            return page.render({
                canvasContext: ctx,
                viewport: scaledViewport,
            }).promise;
        })
        .then(() => {
            loadingIndicator.style.display = "none";
            canvas.style.display = "block";
        })
        .catch((err) => {
            console.error(err);
            displayError("Error: Could not display the resume preview.");
        });
});