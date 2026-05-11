let model;
const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const resultado = document.getElementById("resultado");

//Lista de frutas suportadas pelo COCO-SSD
const frutas = ["banana", "apple", "orange"];

//Tradução das classes
const traducoes = {
    banana: "Banana",
    apple: "Maçã",
    orange: "Laranja"
};

//Inicialização da câmera
async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    return new Promise(resolve => {
        video.onloadedmetadata = () => resolve(video);
    });
}

//Carregar modelo COCO-SSD
async function loadModel() {
    model = await cocoSsd.load();
    console.log("Modelo COCO-SSD carregado!");
}

//Estimar maturação por cor
function estimarMaturacao(x, y, width, height) {
    const imageData = ctx.getImageData(x, y, width, height);

    let r = 0, g = 0, b = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
        r += imageData.data[i];
        g += imageData.data[i + 1];
        b += imageData.data[i + 2];
    }

    let total = imageData.data.length / 4;
    r /= total;
    g /= total;
    b /= total;

    if (g > r) return "Verde";
    if (r > g && g > b) return "Madura";
    return "Passada";
}

//Função principal de detecção (SEM piscar)
async function detectar() {
    const predictions = await model.detect(video);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    let html = "";

    predictions.forEach(pred => {

        // Filtrar apenas frutas
        if (!frutas.includes(pred.class)) return;

        const [x, y, width, height] = pred.bbox;

        // Caixa
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Maturação
        let maturacao = estimarMaturacao(x, y, width, height);

        // Traduzir nome
        let nome = traducoes[pred.class] || pred.class;

        // Texto no canvas
        ctx.fillStyle = "#00FF00";
        ctx.fillText(
            `${nome} (${(pred.score * 100).toFixed(1)}%)`,
            x,
            y > 10 ? y - 5 : 10
        );

        ctx.fillText(
            `Maturação: ${maturacao}`,
            x,
            y + height + 15
        );

        // Painel HTML
        html += `
            <div class="item">
                <strong>Fruta:</strong> ${nome} <br>
                <strong>Confiança:</strong> ${(pred.score * 100).toFixed(1)}% <br>
                <strong>Maturação:</strong> ${maturacao}
            </div>
        `;
    });

    // Atualizar painel
    if (html === "") {
        html = "<p>Nenhuma fruta detectada...</p>";
    }

    resultado.innerHTML = html;
}

function ajustarCanvas() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
}

video.addEventListener("loadedmetadata", ajustarCanvas);

// Loop otimizado (sem flicker)
function iniciarDeteccao() {
    setInterval(() => {
        detectar();
    }, 500); // atualiza a cada 0.5s
}

// Inicialização geral
async function main() {
    await setupCamera();
    await loadModel();
    iniciarDeteccao();
}

main();