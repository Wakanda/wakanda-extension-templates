import { Component } from '@angular/core';
import { ROUTER_DIRECTIVES } from '@angular/router';

import { ApiService } from './shared';

import { Wakanda } from './wakanda.service';

import '../style/app.scss';

/*
 * App Component
 * Top Level Component
 */
@Component({
  selector: 'my-app', // <my-app></my-app>
  providers: [ApiService, Wakanda],
  directives: [...ROUTER_DIRECTIVES],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  url = 'https://github.com/preboot/angular2-webpack';

  //constructor(private api: ApiService) {

  wakandaClientVersion: string = undefined;
  constructor(private api: ApiService, public wakanda: Wakanda) {
    this.wakandaClientVersion = this.wakanda.wakandaClientVersion;
  }
}
