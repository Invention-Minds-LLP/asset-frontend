import { Component } from '@angular/core';
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
    totalSize: number = 0;
    totalSizePercent: number = 0;

    constructor(private messageService: MessageService) { }

    onSelectedFiles(event: any) {
        this.totalSize = 0;
        for (let file of event.files) {
            this.totalSize += file.size || 0;
        }
        this.totalSizePercent = (this.totalSize / 1000000) * 100;
        this.messageService.add({ severity: 'info', summary: 'Files Selected', detail: `${event.files.length} files chosen.` });
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

    onRemoveTemplatingFile(event: any, file?: any, removeFileCallback?: Function, index?: number) {
        let removedFile = file || event.file;

        if (removedFile) {
            if (removeFileCallback && index !== undefined) {
                removeFileCallback(index);
            }
            this.totalSize -= removedFile.size || 0;
            this.totalSizePercent = (this.totalSize / 1000000) * 100;
            this.messageService.add({ severity: 'warn', summary: 'File Removed', detail: `${removedFile.name} removed from pending.` });
        }
    }

    onRemoveUploadedFile(event: any, file: any, removeUploadedFileCallback: Function, index: number) {
        removeUploadedFileCallback(index);
        this.messageService.add({ severity: 'info', summary: 'File Removed', detail: `${file.name} removed from uploaded.` });
    }
}