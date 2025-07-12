import { Component, Output, EventEmitter } from '@angular/core';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { BadgeModule } from 'primeng/badge';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-drag-and-drop',
    standalone: true,
    imports: [
        FileUploadModule,
        ButtonModule,
        BadgeModule,
        ProgressBarModule,
        ToastModule,
        CommonModule
    ],
    templateUrl: './drag-and-drop.html',
    styleUrl: './drag-and-drop.css',
    providers: [MessageService]
})
export class DragAndDrop {
    @Output() fileSelected = new EventEmitter<File[]>();
    totalSize: number = 0;
    totalSizePercent: number = 0;
    selectedFiles: File[] = [];

    constructor(private messageService: MessageService) { }

    onSelectedFiles(event: any) {
        const files: File[] = Array.from(event.files || event.originalEvent?.target?.files || []);
      
        if (!files.length) {
          console.warn('No files found in onSelect event:', event);
          return;
        }
      
        this.selectedFiles = files;
        this.fileSelected.emit(files);
      
        this.totalSize = files.reduce((sum:any, file:any) => sum + file.size, 0);
        this.totalSizePercent = (this.totalSize / 1000000) * 100;
      
        this.messageService.add({
          severity: 'info',
          summary: 'Files Selected',
          detail: `${files.length} file(s) chosen.`
        });
      }
      
    // MODIFIED: onTemplatedUpload to provide specific message
    onTemplatedUpload(event: any) {
        this.totalSize = 0;
        this.totalSizePercent = 0;

        let detailMessage = '';
        if (event.files && event.files.length > 0) {
            if (event.files.length === 1) {
                detailMessage = `'${event.files[0].name}' uploaded successfully.`;
            } else {
                detailMessage = `${event.files.length} files uploaded successfully.`;
            }
        } else {
            detailMessage = 'File(s) uploaded successfully.'; // Fallback
        }

        this.messageService.add({ severity: 'success', summary: 'Upload Complete', detail: detailMessage });

        console.log('Uploaded files:', event.files);
    }

    onClear() {
        this.totalSize = 0;
        this.totalSizePercent = 0;
        this.messageService.add({ severity: 'info', summary: 'Cleared', detail: 'All files cleared.' });
    }

    formatSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    choose(event: any, chooseCallback: any) {
        chooseCallback();
    }

    uploadEvent(uploadCallback: any) {
        uploadCallback();
    }

    onRemoveTemplatingFile(event: any, file: File, removeFileCallback: Function) {
        if (!Array.isArray(this.selectedFiles)) {
          console.error('selectedFiles is not an array:', this.selectedFiles);
          return;
        }
      
        const index = this.selectedFiles.findIndex(f => f.name === file.name && f.size === file.size);
        if (index !== -1) {
          this.selectedFiles.splice(index, 1);
          removeFileCallback(index); // Remove from PrimeNG file list
          this.fileSelected.emit(this.selectedFiles); // Emit updated list to parent
        }
      }
      
      

    onRemoveUploadedFile(event: any, file: any, removeUploadedFileCallback: Function, index: number) {
        removeUploadedFileCallback(index);
        this.messageService.add({ severity: 'info', summary: 'File Removed', detail: `${file.name} removed from uploaded.` });
    }
}