import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder } from "@angular/forms";
import { Platform } from "@ionic/angular";
import { HttpClient } from "@angular/common/http";
import { FileOpener } from "@ionic-native/file-opener/ngx";

import {
  Plugins,
  CameraResultType,
  CameraSource,
  FilesystemDirectory,
} from "@capacitor/core";
const { Camera, Filesystem } = Plugins;

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"],
})
export class HomePage implements OnInit {
  myForm: FormGroup;
  pdfObj = null;
  base64Image = null;
  photoPreview = null;
  logoData = null;
  constructor(
    private fb: FormBuilder,
    private plt: Platform,
    private http: HttpClient,
    private fileOpener: FileOpener
  ) {}

  ngOnInit() {
    this.myForm = this.fb.group({
      showLogo: true,
      from: "Simon",
      to: "Max",
      text: "TEST",
    });
    this.loadLocalAssetToBase64();
  }

  loadLocalAssetToBase64() {
    this.http
      .get("./assets/img/GrandCanyon.jpg", { responseType: "blob" })
      .subscribe((res) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          this.logoData = reader.result;
        };
        reader.readAsDataURL(res);
      });
  }

  async takePicture() {
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
    });

    this.photoPreview = `data:image/jpeg;base64,${image.base64String}`;
  }

  createPdf() {
    const formValue = this.myForm.value;
    const image = this.photoPreview
      ? { image: this.photoPreview, width: 300 }
      : {};

    let logo = {};
    if (formValue.showLogo) {
      logo = { image: this.logoData, width: 50 };
    }

    const docDefinition = {
      watermark: {
        text: "Ionic Academy",
        color: "blue",
        opacity: 0.2,
        bold: true,
      },
      content: [
        {
          columns: [
            logo,
            {
              text: new Date().toTimeString(),
              alignment: "right",
            },
          ],
        },
        { text: "REMINDER", style: "header" },
        {
          columns: [
            {
              width: "50%",
              text: "From",
              style: "subheader",
            },
            {
              width: "50%",
              text: "To",
              style: "subheader",
            },
          ],
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 15, 0, 0],
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 15, 0, 0],
        },
      },
    };
    this.pdfObj = pdfMake.createPdf(docDefinition);
    console.log(this.pdfObj);
  }

  downloadPdf() {
    if (this.plt.is("cordova")) {
      this.pdfObj.getBase64(async (data) => {
        try {
          let path = `pdf/myletter_${Date.now()}.pdf`;

          const result = await Filesystem.writeFile({
            path,
            data: data,
            directory: FilesystemDirectory.Documents,
            recursive: true,
          });
          this.fileOpener.open(`${result.uri}`, "application/pdf");
        } catch (e) {
          console.error("Unable to write file", e);
        }
      });
    } else {
      this.pdfObj.download();
    }
  }
}
