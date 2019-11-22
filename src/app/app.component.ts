import {Component, OnInit} from '@angular/core';
import {concat, from, fromEvent, interval, Observable, of, Subject, throwError} from 'rxjs';
import {
  catchError,
  filter,
  map,
  mergeMap,
  multicast,
  pluck,
  publish, publishBehavior,
  publishLast, publishReplay,
  refCount,
  share,
  take,
  takeUntil,
  tap
} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'rxjsPractice';

  numbs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  ngOnInit(): void {
    // this.creatingObservables();
    // this.subscribingToObservablesWithObservers();
    // this.observableOperators();
    this.subjectsAndMulticastedObservables();
  }

  creatingObservables() {
    // Basic Observable example (can do Observable.create() or new Observable())
    let numbsObservable$: Observable<any> = Observable.create((subscriber => {

      for (let i=0; i < this.numbs.length; i++) {
        setTimeout(() => {
          if(typeof this.numbs[i] === 'string') {
            subscriber.error('This is a string!!!  Not a number!');
          }

          subscriber.next(this.numbs[i]);
        }, i*500);

      }

      setTimeout(() => {
        subscriber.complete();
      }, 6000);

      return () => console.log('Executing teardown code.');
    }));

    // numbsObservable$.subscribe(number => console.log(number));

    // of() will take just about anything and make an observable out of it
    let source1$ = of('hello', 10, true, this.numbs);
    // source1$.subscribe(value => console.log(value));

    // from() will take generally iterables or even another observable like in source3$ example
    let source2$ = from(this.numbs);
    // source2$.subscribe(value => console.log(value));

    let source3$ = from(numbsObservable$);
    // source3$.subscribe(value => console.log(value));

    // concat() will combine observables and execute them in order
    let source4$ = concat(source1$, source2$, source3$, numbsObservable$);
    // source4$.subscribe(value => console.log(value));

    // fromEvent() sets up observables from some sort of event ...like a click or something
    let source5$ = fromEvent(document, 'click');
    // source5$.pipe(pluck('x')).subscribe(value => console.log(value));
  }

  subscribingToObservablesWithObservers() {
    // subscribing with an Observer
    // let myObserver = {
    //   next: value => console.log(`Value produced: ${value}`),
    //   error: err => console.log(`Error: ${err}`),
    //   complete: () => console.log('All done producing values.')
    // };
    let sourceObservable$ = of(1, 3, 5);
    // sourceObservable$.subscribe(myObserver);
    // This is the same as above as long as you put them in order for next, error, complete
    // sourceObservable$.subscribe(
    //   value => console.log(`Value produced: ${value}`),
    //   err => console.log(`Error: ${err}`),
    //   () => console.log('All done producing values.')
    // );

    // Multiple subscriptions to same observable.
    // let currentTime$ = new Observable(subscriber => {
    //   const timeString = new Date().toLocaleTimeString();
    //   subscriber.next(timeString);
    //   subscriber.complete();
    // });
    //
    // currentTime$.subscribe(currentTime => {console.log(`Observer 1: ${currentTime}`);});
    //
    // setTimeout(() => {
    //   currentTime$.subscribe(currentTime => {console.log(`Observer 2: ${currentTime}`);});
    // }, 1000);
    //
    // setTimeout(() => {
    //   currentTime$.subscribe(currentTime => {console.log(`Observer 3: ${currentTime}`);});
    // }, 2000);

    // Unsubscribing examples:
    // let timer$ = interval(1000);
    // Same as above but with tear down visibility
    let timer$ = new Observable(subscriber => {
      let i = 0;
      let intervalId = setInterval(() => {
        subscriber.next(i++);
      }, 1000);

      return () => {
        console.log('Executing teardown code.');
        clearInterval(intervalId);
      };
    });

    let timerSubscription = timer$.subscribe(
      value => console.log(`${new Date().toLocaleTimeString()} (${value})`),
      null,
      () => console.log('All done!')
    );

    let timerSubscription2 = timer$.subscribe(
      value => console.log(`${new Date().toLocaleDateString()} (${value})`)
    );
    // Without the below line, when you call unsubscribe in fromEvent(), timerSubscription will cancel,
    // but timerSubscription2 will keep counting.
    timerSubscription.add(timerSubscription2);

    fromEvent(document, 'click').subscribe(
      event => timerSubscription.unsubscribe()
    );
  }

  observableOperators() {
    // Manually applying an operator
    let source$ = of(1,2,3,4,5);
    // let doubler = map((value: any) => value * 2);
    // let doubled$ = doubler(source$);
    // doubled$.subscribe(
    //   value => console.log(value)
    // );

    // Chaining operators is how it used to be done in rxjs <5.something... just in case you run into it
    // source$
    //   .map(value => value * 2)
    //   .filter(mappedValue => mappedValue > 5)
    //   .subscribe(
    //     finalValue => console.log(finalValue)
    //   );

    // How it's done now
    // source$.pipe(
    //   map(value => value * 2),
    //   filter(mappedValue => mappedValue > 5)
    // ).subscribe(
    //   finalValue => console.log(finalValue)
    // );

    // Error handling
    // let mockAjaxResponseObject$ = of({
    //   originalEvent: {whatever: 'whatever'},
    //   request: 'My request',
    //   response: [
    //     {bookId: 1, title: 'Goodnight Moon', author: 'Margaret Wise Brown', publicationYear: 1953},
    //     {bookId: 2, title: 'Winnie-the-pooh', author: 'A. A. Milne', publicationYear: 1926},
    //     {bookId: 3, title: 'Where the Wild Things Are', author: 'Maurice Sendak', publicationYear: 1963}
    //   ],
    //   responseType: 'json',
    //   status: 200
    // });
    //
    // let mockAjaxErrorObject$ = of(new ErrorEvent('ERRRRRRRRROOOOOORRRRRR'));
    //
    // mockAjaxResponseObject$.pipe(
    //   mergeMap(ajaxResponse => ajaxResponse.response),
    //   filter(book => book.publicationYear < 1960),
    //   tap(oldBook => console.log(`Title: ${oldBook.title}`)),
    //   // catchError(err => of({title: 'Corduroy', author: 'Don Freeman'}))
    //   // catchError((err, caught) => caught)
    //   // catchError(err => {throw `Something bad happened - ${err}`;})
    //   // catchError(err => throwError(err))
    // ).subscribe(
    //   finalValue => console.log(finalValue),
    //   error => console.log(`ERROR: ${error}`)
    // );



    let timer$ = new Observable(subscriber => {
      let i = 0;
      let intervalId = setInterval(() => {
        subscriber.next(i++);
      }, 1000);

      return () => {
        console.log('Executing teardown code.');
        clearInterval(intervalId);
      };
    });

    let cancelTimer$ = fromEvent(document, 'click');

    // These (take and takeUntil) get the subscriber tear down code and the observable complete handler code as well
    // timer$.pipe(
    //   take(6)
    // )
    timer$.pipe(
      takeUntil(cancelTimer$)
    )
    .subscribe(
      value => console.log(`${new Date().toLocaleTimeString()} (${value})`),
      null,
      () => console.log('All done!')
    );
  }

  subjectsAndMulticastedObservables() {
    // let subject$ = new Subject();
    //
    // subject$.subscribe(
    //   value => console.log(`Observer 1: ${value}`)
    // );
    //
    // subject$.subscribe(
    //   value => console.log(`Observer 2: ${value}`)
    // );
    //
    // subject$.next('Hello!');
    //
    // let source$ = new Observable(subscriber => {
    //   subscriber.next('Greetings!');
    // });
    //
    // source$.subscribe(subject$);

    // Cold and Hot Observables
    // let source$ = interval(1000).pipe(
    //   take(4)
    // );

    // Add this block of code and change instances of source$ to subject$ to change a cold observable(interval) to a hot observable(subject)
    // let subject$ = new Subject();
    // source$.subscribe(subject$);

    // source$.subscribe(
    //   value => console.log(`Observer 1: ${value}`)
    // );
    //
    // setTimeout(() => {
    //   source$.subscribe(
    //     value => console.log(`Observer 2: ${value}`)
    //   );
    // }, 1000);
    //
    // setTimeout(() => {
    //   source$.subscribe(
    //     value => console.log(`Observer 3: ${value}`)
    //   );
    // }, 2000);

    // Multicast Operators (multicast(), refCount(), publish(), share()
    // let source$ = interval(1000).pipe(
    //   take(4),
    //   // multicast(new Subject()),
    //   // publish(),
    //   // refCount()
    //   share()
    // );
    //
    // source$.subscribe(
    //   value => console.log(`Observer 1: ${value}`)
    // );
    //
    // setTimeout(() => {
    //   source$.subscribe(
    //     value => console.log(`Observer 2: ${value}`)
    //   );
    // }, 1000);
    //
    // setTimeout(() => {
    //   source$.subscribe(
    //     value => console.log(`Observer 3: ${value}`)
    //   );
    // }, 2000);
    //
    // setTimeout(() => {
    //   source$.subscribe(
    //     value => console.log(`Observer 4: ${value}`),
    //     null,
    //     () => console.log('Observer 4 complete.')
    //   );
    // }, 4500);
    // @ts-ignore
    // source$.connect(); //this is for the multicast operator... allows you to control when to start subscription

    // Specialized Subjects (AsyncSubject, BehaviorSubject, ReplaySubject
    let source$ = interval(1000).pipe(
      take(4),
      // publishLast(), // same thing as AsyncSubject- takes last broadcasted value
      // publishBehavior(42),  // same thing as BehaviorSubject- emits every value broadcasted post subscription
      publishReplay(),  // same as ReplaySubject- values are stored and replayed with each subscription
      refCount()
    );

    source$.subscribe(
      value => console.log(`Observer 1: ${value}`)
    );

    setTimeout(() => {
      source$.subscribe(
        value => console.log(`Observer 2: ${value}`)
      );
    }, 1000);

    setTimeout(() => {
      source$.subscribe(
        value => console.log(`Observer 3: ${value}`)
      );
    }, 2000);

    setTimeout(() => {
      source$.subscribe(
        value => console.log(`Observer 4: ${value}`),
        null,
        () => console.log('Observer 4 complete.')
      );
    }, 4500);

  }

}
