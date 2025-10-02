import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PopupComponent } from './popup.component';
import { PopupContainerComponent } from './popup-container.component';
import { PopupService } from './popup.service';

@NgModule({
  declarations: [
    PopupComponent,
    PopupContainerComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  exports: [
    PopupComponent,
    PopupContainerComponent
  ],
  providers: [
    PopupService
  ]
})
export class PopupModule { }
