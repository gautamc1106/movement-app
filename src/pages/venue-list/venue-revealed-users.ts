import {Component} from '@angular/core';
import {ViewController, NavParams, AlertController} from 'ionic-angular';
import {InAppBrowser} from '@ionic-native/in-app-browser';
// import {CHART_DIRECTIVES} from 'ng2-charts/ng2-charts';
// import {GOOGLE_MAPS_DIRECTIVES} from 'angular2-google-maps/core';
import {GeoService} from '../../services/geo';
import {AccountService} from '../../services/account';

import {VenueService} from '../../services/venues';
import {Venue} from '../../models/venue';

@Component({
  template: `
<ion-toolbar primary style="padding-top:20px">
  <ion-title style="padding-top:20px">{{venue.name}}</ion-title>
  
  <ion-buttons end>
    <button ion-button icon-only (click)="close()">
      <ion-icon name="close"></ion-icon>
    </button>
  </ion-buttons>
</ion-toolbar>
<ion-content style="margin-top:44px;">
  <agm-map 
    [latitude]="venue.lat" 
    [longitude]="venue.lng" 
    [zoom]="15" 
    [zoomControl]="false"
    [usePanning]="true"
    [disableDefaultUI]="true"
    [streetViewControl]="false"
    [scrollwheel]="false"
    [styles]="geoService.mapStyle">

      <agm-marker 
        [iconUrl]="iconUrl"
        [latitude]="venue.lat"  
        [longitude]="venue.lng">
      </agm-marker>

    </agm-map>
  
  <div padding>
    <button ion-button block outline (click)="openInMaps()">Open in Maps</button>
  </div>
  <ion-list no-lines>
    <ion-list-header>
      {{venue.reveals}} out of {{venue.checkins}} have revealed themselves
    </ion-list-header>
    
    <div *ngIf="haveIBeenHere(venue)">
      <ion-item *ngIf="!venue.revealed">
        <button ion-button block outline (click)="signintoVenue(venue)">Reveal</button>
      </ion-item>
    </div>
    
    <div *ngIf="!haveIBeenHere(venue)">
      <ion-item *ngIf="!venue.revealed">
        You have not been here.
      </ion-item>
    </div>
    <div *ngIf="venue.revealed">
      <ion-item *ngFor="let user of venue.revealed_users">
        {{user}}
      </ion-item>
    </div>
  </ion-list>
</ion-content>
  `,

  styles: [`
  agm-map {
       height: 150px;
       touch-action: none;
       pointer-events: none;
    }`],
})
export class RevealedUserListModal {
  venue:Venue;
  iconUrl:string ="assets/branding/venue.png";
  chartType:string = 'pie';
  chartLabels:string[] =[];
  chartData:number[] = [];
  chartOptions:any = {
    animation: {
      animateRotate: true,
      animateScale: true,
    },
    responsive: false,
    legend: {
      display: true,
      position: 'bottom',
      fullWidth: true
    }
  };

  dataLoaded:boolean = false

  constructor(public alertCtrl: AlertController,
              private viewCtrl: ViewController,
              private iab: InAppBrowser,
              public params: NavParams,
              public venueService: VenueService,
              public accountService: AccountService,
              public geoService:GeoService) {
                //  console.log(params.data.venue);
                 this.venue = params.data.venue;

                 this.chartLabels = ['Revealed', 'Visited'];
                 this.chartData = [this.venue.reveals, this.venue.checkins];
                 
                 this.accountService.logEvent(`page_enter_venueDetails_${this.venue.id}`);
  }


  getFill(venue:Venue):string{
    return this.venueService.calculateFillPercent(venue, 80) + 'px';
  }

  haveIBeenHere(venue:Venue):boolean{
    let flag = false;
    this.venueService.venues.forEach(v=>{ 
      if(v.id == venue.id){ flag = true; }
    });
    return flag;      
  }

  openInMaps(){
    this.accountService.logEvent(`open_maps_venueDetails_${this.venue.id}`);
    this.iab.create(`http://maps.apple.com/?daddr=${this.venue.lat},${this.venue.lng}`, '_system');
  }

  signintoVenue() {
    let alert = this.alertCtrl.create({
      title: `Sign in to ${this.venue.name}`,
      subTitle: 'When you reveal, your signature will only be visible to other people who have also revealed themselves here.',
      buttons: [{
        text: 'Not now',
        handler: data => {
          this.accountService.logEvent(`reveal_dismiss_venueDetails_${this.venue.id}`);
        }
      },{
        text: 'Reveal',
        handler: data => {
            this.venueService.signintoVenue(this.venue).subscribe(
              i => {
                this.venue.revealed = true;
                this.venue.reveals += 1;
                this.venue.revealed_users.push(this.accountService.me.username);

                this.accountService.logEvent(`reveal_pass_venueDetails_${this.venue.id}`);

              },
              e => console.log(e),
              () => {}
            )
          }
      }]
    });
    alert.present(alert);
  }
  

  close() {
    this.viewCtrl.dismiss();
  }
}