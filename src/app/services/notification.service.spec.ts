import 'zone.js/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('should start with no notifications', () => {
    let current: any[] = [];
    service.notifications$.subscribe(n => (current = n));
    expect(current.length).toBe(0);
  });

  it('should add a notification and auto-remove after 2 seconds', fakeAsync(() => {
    let current: any[] = [];
    service.notifications$.subscribe(n => (current = n));

    service.success('hello');
    expect(current.length).toBe(1);

    tick(2000);
    expect(current.length).toBe(0);
  }));

  it('should clear timers when clearing all notifications', fakeAsync(() => {
    service.success('one');
    service.success('two');
    expect(Object.keys((service as any).timers).length).toBe(2);

    service.clear();
    expect(Object.keys((service as any).timers).length).toBe(0);

    let current: any[] = [];
    service.notifications$.subscribe(n => (current = n));
    expect(current.length).toBe(0);
  }));

  it('should allow manual removal before timeout', fakeAsync(() => {
    let current: any[] = [];
    service.notifications$.subscribe(n => (current = n));

    service.error('err');
    const id = current[0].id;
    service.remove(id);
    expect(current.length).toBe(0);
  }));
});
