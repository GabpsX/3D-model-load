const { ipcRenderer } = require('electron');
const fs = require('fs'); 
const { dialog } = require('electron');
const path = require('path');


//pasta resources
const appPath = path.join(__dirname, '..', 'resources');
const get_path = path.dirname(appPath);
let parentDirectoryPath = get_path.replace(/\\app\.asar$/, '');

class InitLoader {
  constructor(showFilesElement) {
    this.showFilesElement = showFilesElement; 
  }
  start_web_view(class_, url) {
    window.onload = () => {

          let webview = document.createElement("webview");
          webview.setAttribute("class", class_);
          webview.setAttribute("src", url);
          webview.setAttribute("nodeintegration", "");
          webview.setAttribute("webpreferences", "contextIsolation=false");
          webview.addEventListener('dom-ready', () => {
            console.log("created"); 
            //webview.openDevTools();
          });
          console.log(webview);
      const right_container = document.querySelector(".right_container");
      right_container.appendChild(webview);
      webview.addEventListener("console-message", (event) => {
        // Verifique se a mensagem é um erro (level: error)
        if (event.level) { // 2 é o código para erro
          console.log(`log WebView: ${event.message}`);
        } else {
          console.log(`log WebView: ${event.message}`);
        }
      });
    };
  }
  
  deletarArquivo(nomeArquivo) {

    console.log(nomeArquivo);
    const parentDirectoryPath = 'resources/modelos'; // Caminho fixo da pasta
  
    const caminhoCompleto = path.join(parentDirectoryPath, nomeArquivo);
  
    try {
      // Verifica se o arquivo existe
      if (fs.existsSync(caminhoCompleto)) {
        // Deleta o arquivo
        fs.unlinkSync(caminhoCompleto);
        console.log(`O arquivo ${nomeArquivo} foi excluído com sucesso.`);
      } else {
        console.log(`O arquivo ${nomeArquivo} não existe.`);
      }
    } catch (error) {
      console.error(`Erro ao excluir o arquivo ${nomeArquivo}:`, error);
    }
  }


  ciar_pasta_modelos() {
     // Verifique se a pasta já existe
     console.log(parentDirectoryPath)

     if (!fs.existsSync(parentDirectoryPath+"/modelos")) {
       fs.mkdir("resources/modelos", { recursive: true }, (erro) => {
         if (erro) {
           console.error('Erro ao criar a pasta:', erro);
         } else {
          console.log('Pasta de modelos 3D criada com sucesso!');
          const jsonData = JSON.stringify("none");
          const filePath = 'resources/modelos/model.json';
          fs.writeFileSync(filePath, jsonData);
         }
       });
     } else {
          console.log('A pasta de modelos 3D já existe.');
          console.log(parentDirectoryPath)
          console.log(parentDirectoryPath+"/modelos")
          
     }
     
  }
  atualizarPath(novoPath) {
    const object_sele = document.querySelector('.object_render');
    object_sele.removeAttribute('data');
    object_sele.setAttribute('src', novoPath);
 }

  recarregarPagina() {
     location.reload();
 }

  listModelFolder() {

    ipcRenderer.send('list-model-folder');

    ipcRenderer.on('model-folder-content', (event, modelFiles) => {

    console.log("modelos", modelFiles, event)
    this.showFilesElement.innerHTML = "";
    for (let i = 0; i < modelFiles.length; i++) {

      if (modelFiles[i] !== "model.json" && modelFiles[i] !== undefined) {
        const iconChevron = document.createElement("i");
        iconChevron.classList.add("bi", "bi-badge-3d");
        const item_div = document.createElement("div");
        item_div.classList.add("item-select");
        item_div.setAttribute("namefile", modelFiles[i]);

        const iconDelete = document.createElement("i");
        iconDelete.classList.add("bi", "bi-trash-fill", "delete_file");
        item_div.setAttribute("namefile", modelFiles[i]);
   

        const file_name = document.createElement("h5");
        file_name.classList.add("file_name");

        if(modelFiles[i].length > 20) {
          file_name.innerText = modelFiles[i].slice(0, 20) + "...";
        }
        else {
          file_name.innerText = modelFiles[i];
        }

        this.showFilesElement.appendChild(item_div);

        item_div.appendChild(iconChevron);
        item_div.appendChild(file_name);
        item_div.appendChild(iconDelete);
        

        iconDelete.addEventListener('click', () => {
          const modelName = item_div.getAttribute('namefile');
          this.deletarArquivo(modelName);
          this.listModelFolder();
        });

        item_div.addEventListener('dblclick', function() {
          const modelName = this.getAttribute('namefile');
          const jsonData = JSON.stringify(modelName);

          const filePath = 'resources/modelos/model.json';
          console.log(filePath);
          fs.writeFileSync(filePath, jsonData);

        });
      }
    }
    });
/*
    ipcRenderer.on('model-folder-error', (event, errorMessage) => {
      console.log('Erro ao listar a pasta model:', errorMessage);
    });*/
  }
}

const fileElement = document.querySelector(".files_names");
const initLoader = new InitLoader(fileElement);
initLoader.start_web_view("object_render", "projeto3D.html");

initLoader.listModelFolder();

initLoader.ciar_pasta_modelos();



document.querySelector(".reload_scene").addEventListener("click", () => {
     initLoader.recarregarPagina();
}) 


document.querySelector(".change_model").addEventListener("click", () => {
     initLoader.atualizarPath('projeto3D.html');
})


const importButton = document.getElementById('importButton');

importButton.addEventListener('click', () => {
  ipcRenderer.send('open-file-dialog');
});

ipcRenderer.on('selected-file', (event, filePath) => {

  const destinationDirectory = "resources/modelos";
  const fileName = path.basename(filePath);
  const destinationPath = path.join(destinationDirectory, fileName);
  console.log(destinationPath);
  fs.copyFile(filePath, destinationPath, (err) => {
    if (err) {
      console.error('Erro ao copiar o arquivo:', err);
    } else {
      initLoader.listModelFolder();
      console.log('Arquivo copiado com sucesso para:');
    }
  });
});






