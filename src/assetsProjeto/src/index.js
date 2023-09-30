const fs = require('fs');
const path = require('path');

function main(model_path) {

  let currentQuality = "Medium";
  // Configuração da cena
  const canvas = document.getElementById("renderCanvas");

  const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
      engineOptions: {
          useWebGPU: true
      }
  });
  const createScene = async function() {
      const scene = new BABYLON.Scene(engine);

      // Configuração da câmera
      const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 4, 20, BABYLON.Vector3.Zero(), scene);

      camera.lowerRadiusLimit = 8; // Distância mínima
      camera.upperRadiusLimit = 50; //d max  

      camera.upperBetaLimit = Math.PI / 2.3;


      camera.attachControl(canvas, true);


      // Carregar modelo 3D
      const model = await BABYLON.SceneLoader.ImportMeshAsync("", "", `${model_path}`, scene);
      console.log(model_path);
      const reflectionTexture = new BABYLON.HDRCubeTexture('assetsProjeto/acoustical_shell_2k.hdr', scene, 512);


      const pbrMaterial = new BABYLON.PBRMaterial("pbrMaterial", scene);
      pbrMaterial.reflectionTexture = reflectionTexture;
      pbrMaterial.metallic = 1.5; //valor para controlar o brilho metálico
      pbrMaterial.roughness = 0.2; //valor para controlar a rugosidade


      const skyboxMaterial = new BABYLON.StandardMaterial("skyboxMaterial", scene);
      skyboxMaterial.backFaceCulling = false;

      const skyboxTexture = new BABYLON.CubeTexture("assetsProjeto/textures/skybox/", scene);
      skyboxMaterial.reflectionTexture = skyboxTexture;

      const skybox = BABYLON.MeshBuilder.CreateBox("skybox", {
          size: 300.0
      }, scene);
      skybox.material = skyboxMaterial;
      skyboxMaterial.backFaceCulling = false;
      skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
      skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
      skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
      skybox.material = skyboxMaterial;

      var pipeline = new BABYLON.DefaultRenderingPipeline(
          "defaultPipeline",
          true,
          scene,
          [camera]
      );

      //const grainEffect = new BABYLON.GrainPostProcess("grain", 1, camera);
      pipeline.imageProcessing.contrast = 3;
      pipeline.grain.intensity = 10;
      pipeline.imageProcessingEnabled = true;
      scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
      scene.fogColor = scene.clearColor;
      scene.fogStart = 5.0;
      scene.fogEnd = 140.0;
      scene.gravity = new BABYLON.Vector3(0, -0.9, 0);
      scene.collisionsEnabled = true;
      camera.checkCollisions = true;
      camera.applyGravity = true;

      //camera.ellipsoid = new BABYLON.Vector3(1, 1, 1);


      const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap("ground", "assetsProjeto/he.jpg", {
          width: 150,
          height: 150,
          subdivisions: 20,
          minHeight: 0,
          maxHeight: 0
      }, scene);

      // Move o ground para baixo no eixo Y
      ground.position.y = -0.25;

      const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
      groundMaterial.diffuseTexture = new BABYLON.Texture("assetsProjeto/grd.jpg", scene);
      groundMaterial.diffuseTexture.uScale = 50; // Duplicar horizontalmente
      groundMaterial.diffuseTexture.vScale = 50; // Duplicar verticalmente
      groundMaterial.diffuseTexture.filteringQuality = BABYLON.Texture.TRILINEAR_SAMPLINGMODE;
      groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0); 
      groundMaterial.ambientColor = new BABYLON.Color3(1, 1, 1); 
      ground.material = groundMaterial;


      // luz hemisférica
      const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
      hemiLight.diffuse = new BABYLON.Color3(1, 1, 1);
      hemiLight.specular = new BABYLON.Color3(0, 0, 0);
      hemiLight.groundColor = new BABYLON.Color3(1, 1, 1);


      // luz spot 
      var spotLight = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(0, 10, 0), new BABYLON.Vector3(0, -1, 0), Math.PI / 3, 2, scene);
      spotLight.intensity = 1.2;

    
      spotLight.shadowEnabled = true;

     
      spotLight.position = new BABYLON.Vector3(0, 10, 0);


      function setRenderSettings(quality) {

          switch (quality) {
              case "Very Low":
                  engine.setHardwareScalingLevel(2);
                  break;
              case "Low":
                  engine.setHardwareScalingLevel(1.3);
                  break;
              case "Medium":
                  engine.setHardwareScalingLevel(1);
                  break;
              case "High":
                  engine.setHardwareScalingLevel(0.8);
                  break;
              case "Very high":
                  engine.setHardwareScalingLevel(0.5);
                  break;
              case "Ultra":
                  engine.setHardwareScalingLevel(0.2);
                  break;
          }
          console.log(quality);
          engine.resize();
      }

    
      function applyQuality(quality) {
          currentQuality = quality;
          setRenderSettings(currentQuality);
      }

      setRenderSettings(currentQuality);
      //def textur-text ultra
      document.querySelector(".textur-text").innerText = "Ultra"

      const ssao_text = document.querySelector(".ssao-text");
      ssao_text.innerText = "OFF";


      let ssaoPipeline = null;
      function ssao(valor) {
        if (valor === 1) {
          ssaoPipeline = new BABYLON.SSAO2RenderingPipeline("ssaopipeline", scene, valor);
        } else {
          ssaoPipeline.dispose();
          ssaoPipeline = null;
        }
        if (valor === 0.1) {
          scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline("ssaopipeline", camera);

        } else {
          scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssaopipeline", camera);
        }
      }

      
      const bt_ativar_ssao = document.querySelector(".ativar-ssao");
      const bt_desativar_ssao = document.querySelector(".desativar-ssao");
      bt_desativar_ssao.disabled = true;
      bt_ativar_ssao.addEventListener("click", () => {
        ssao(1);
        ssao_text.innerText = "ON";
        bt_ativar_ssao.disabled = true;
        bt_desativar_ssao.disabled = false;
      });
      
      bt_desativar_ssao.addEventListener("click", () => {
        ssao(0.1);
        ssao_text.innerText = "OFF";
        bt_ativar_ssao.disabled = false;
        bt_desativar_ssao.disabled = true;
      });
      

      const fxaa_text = document.querySelector(".fxaa-text");
      const msaa_text = document.querySelector(".msaa-text");
      
      //defa
      fxaa_text.innerText = "OFF";
      msaa_text.innerText = "OFF";
      function fxaa_antialiasing (valor) {
          pipeline.fxaaEnabled = valor;
      }
      const bt_ativar_fxaa = document.querySelector(".ativar-fxaa");
      const bt_desativar_fxaa = document.querySelector(".desativar-fxaa");
      bt_desativar_fxaa.disabled = true;
      bt_ativar_fxaa.addEventListener("click", () => {
        fxaa_antialiasing(true);
        fxaa_text.innerText = "ON";
        bt_ativar_fxaa.disabled = true;
        bt_desativar_fxaa.disabled = false;
      });
      
      bt_desativar_fxaa.addEventListener("click", () => {
        fxaa_antialiasing(false);
        fxaa_text.innerText = "OFF";
        bt_ativar_fxaa.disabled = false;
        bt_desativar_fxaa.disabled = true;
      });


      const msaaValues = [0, 2, 4, 8, 16, 32, 64]; 
      let msaaIndex = 0;
      
      function msaa_antialiasing(valor) {
        pipeline.samples = valor;
      }
      
      const ativarMsaaButton = document.querySelector(".ativar-msaa");
      const desativarMsaaButton = document.querySelector(".desativar-msaa");
      desativarMsaaButton.disabled = true;
      function updateMsaaButtons() {
        ativarMsaaButton.disabled = msaaIndex === msaaValues.length - 1;
        desativarMsaaButton.disabled = msaaIndex === 0;
      }
      updateMsaaButtons();
      
      ativarMsaaButton.addEventListener("click", () => {
        msaaIndex = (msaaIndex + 1) % msaaValues.length; 
        const valorMSAA = msaaValues[msaaIndex];
        msaa_antialiasing(valorMSAA);
        msaa_text.innerText = valorMSAA === 0 ? "OFF" : `${valorMSAA}X`;
        updateMsaaButtons();
      });
      
      desativarMsaaButton.addEventListener("click", () => {
        msaaIndex = (msaaIndex - 1 + msaaValues.length) % msaaValues.length; 
        const valorMSAA = msaaValues[msaaIndex];
        msaa_antialiasing(valorMSAA);
        msaa_text.innerText = valorMSAA === 0 ? "OFF" : `${valorMSAA}X`;
        updateMsaaButtons();
      });
      
      

    const presets = ["Very Low", "Low", "Medium", "High", "Very high", "Ultra"];
    const buttons = document.querySelectorAll(".dimi-qualidade, .aum-qualidade");
    const resoluText = document.querySelector(".resolu-text");
    let currentPresetIndex = 2; // Inicia com o índice do preset "low"
    resoluText.innerText = presets[currentPresetIndex];
    buttons.forEach(button => {
        button.addEventListener("click", () => {
            if (button.classList.contains("dimi-qualidade")) {
                currentPresetIndex = Math.max(currentPresetIndex - 1, 0);
            } else if (button.classList.contains("aum-qualidade")) {
                currentPresetIndex = Math.min(currentPresetIndex + 1, presets.length - 1);
            }
            resoluText.innerText = presets[currentPresetIndex];
            applyQuality(presets[currentPresetIndex])
        });
    });

      const ray_tra = document.querySelector(".tracado-text");
      ray_tra.innerText = "OFF";
      async function ray_tracing(valor) {
       
        if(valor === 1) {
          if (scene.getEngine().isWebGPURayTracingSupported) {
            await scene.getEngine().initWebGPURayTracing();
            scene.getEngine().setWebGPURayTracing({
                enable: true
            });
            ray_tra.innerText = "ON";
        } else {
            console.error("WebGPU Ray Tracing is not supported on this platform.");
            ray_tra.innerText = "Not supported";
        }
        }
        else {
          ray_tra.innerText = "OFF";
        }
      }
   
      const bt_ativar_ray = document.querySelector(".ativar-ray");
      const bt_desativar_ray = document.querySelector(".desativar-ray");
      bt_desativar_ray.disabled = true;
      bt_ativar_ray.addEventListener("click", () => {
        ray_tracing(1);
        bt_ativar_ray.disabled = true;
        bt_desativar_ray.disabled = false;
      });
      
      bt_desativar_ray.addEventListener("click", () => {
        ray_tracing(0);
        bt_ativar_ray.disabled = false;
        bt_desativar_ray.disabled = true;
      });
      



    /*
      document.getElementById("qualityLow").addEventListener("click", () => applyQuality("low"));
      document.getElementById("qualityMedium").addEventListener("click", () => applyQuality("medium"));
      document.getElementById("qualityHigh").addEventListener("click", () => applyQuality("high"));
      document.getElementById("qualityUltra").addEventListener("click", () => applyQuality("ultra"));

  */
      const hdrTexture = new BABYLON.HDRCubeTexture("assetsProjeto/acoustical_shell_2k.hdr", scene, 15, false, true, false, true);

      scene.environmentTexture = hdrTexture;

      return scene;
  }
  createScene().then(scene => {
      engine.runRenderLoop(function() {
          scene.render();
      });
  });
  window.addEventListener("resize", function() {
      engine.resize();
  });


  function updateFPSDisplay() {
      const fpsElement = document.querySelector(".divFPS");
      const currentFPS = engine.getFps().toFixed();
      fpsElement.innerText = currentFPS + " fps";
      setTimeout(updateFPSDisplay, 2000); // Atualiza a cada 2 segundo
  }
  updateFPSDisplay(); // Inicializa a atualização do display de FPS

  const captureButton = document.getElementById("captureButton");
  captureButton.addEventListener("click", function() {
      const dataURL = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = dataURL;
      downloadLink.download = "imagem.png";
      downloadLink.click();
  });
}


function lerArquivoJSON(caminho) {
  const conteudoJSON = fs.readFileSync(caminho, 'utf-8');
  return JSON.parse(conteudoJSON);
}

function init() {

  const appPath = path.join(__dirname, '..', 'resources');
  const get_path = path.dirname(appPath);
  const parentDirectoryPath = get_path.replace(/\\app\.asar$/, '');
  const modelosPath = path.join(parentDirectoryPath,'modelos');

  const jsonFilePath = path.join(modelosPath, 'model.json');

  const nome_arquivo = lerArquivoJSON(jsonFilePath);

 
  const caminhoCompleto = path.join(modelosPath, nome_arquivo);


  
 main(caminhoCompleto);
  var script = document.createElement('script');
  script.src = 'assetsProjeto/memory_stats/master_bookmarklet.js';
  document.head.appendChild(script);
}

init();




const header = document.querySelector("header");
document.querySelector(".op-head-text").addEventListener("click", () => {
  const dialog = document.querySelector(".dialog-menu");
  dialog.style.transform = "scale(0)";
  header.style.transform = "scale(1)";
});
document.querySelector(".open-menu").addEventListener("click", () => {
  const dialog = document.querySelector(".dialog-menu");
  dialog.style.transform = "scale(1)";
  header.style.transform = "scale(0)";
});

const open_header = document.querySelector(".open-header");
open_header.style.transform = "scale(0)"
document.querySelector(".hide-header").addEventListener("click", () => {
  open_header.style.transform = "scale(1)";
  header.style.transform = "scale(0)";
});

open_header.addEventListener("click", () => {
  open_header.style.transform = "scale(0)";
  header.style.transform = "scale(1)";
});

