window.addEventListener("load", () => {
    // Get references to our elements
    const canvas = document.getElementById("pdf-render");
    const loadingIndicator = document.querySelector(".loading-indicator");
    const ctx = canvas.getContext("2d");

    function displayError(message) {
        // Re-purpose the loading indicator to show the error
        loadingIndicator.innerHTML = `<p>${message}</p><p>Please try downloading the file directly.</p>`;
    }

    if (typeof pdfjsLib === "undefined") {
        displayError("Error: Could not load the PDF viewer library.");
        return;
    }

    const url = "/resume/Dillan-Suon-Resume.pdf";
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";

    pdfjsLib.getDocument(url).promise.then((pdfDoc) => {
        return pdfDoc.getPage(1);
    }).then((page) => {
        const container = canvas.parentElement;
        const desiredWidth = container.clientWidth - 30; // Account for padding
        const viewport = page.getViewport({ scale: 1.0 });
        const scale = desiredWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale: scale });

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        return page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
    }).then(() => {
        // --- THIS IS THE KEY ---
        // Success! Hide the loader and show the canvas.
        loadingIndicator.style.display = "none";
        canvas.style.display = "block";
    }).catch((error) => {
        console.error("PDF.js Error:", error);
        displayError("Error: Could not display the resume preview.");
    });
});
