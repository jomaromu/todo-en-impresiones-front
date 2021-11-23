import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { timer } from 'rxjs';
import { AppState } from 'src/app/reducers/globarReducers';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent implements OnInit {

  @ViewChild('wrapLoading', { static: true }) wrapLoading: ElementRef<HTMLElement>;

  constructor(
    private store: Store<AppState>
  ) { }

  ngOnInit(): void {
    this.loading();
  }

  loading(): void {


    this.store.select('loading')
      .subscribe(data => {

        // console.log(data);

        if (data === true) {

          this.wrapLoading.nativeElement.style.display = 'flex';

        } else {

          this.wrapLoading.nativeElement.style.display = 'none';

        }
      });
  }

}
