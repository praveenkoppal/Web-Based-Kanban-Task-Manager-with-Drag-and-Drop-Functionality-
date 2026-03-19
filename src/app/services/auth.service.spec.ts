import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    window.localStorage.clear();
    // pass a browser platform id so isBrowser returns true
    service = new AuthService('browser' as any);
  });

  it('should register a new user but not log them in', async () => {
    const ok = await service.register('alice', 'secret').toPromise();
    expect(ok).toBeTruthy();
    expect(service.isLoggedIn()).toBeFalsy();
    const all = JSON.parse(window.localStorage.getItem('kanban.users') || '[]');
    expect(all.length).toBe(1);
    expect(all[0].username).toBe('alice');
  });

  it('should prevent duplicate registration', async () => {
    await service.register('bob', 'pw').toPromise();
    const ok2 = await service.register('bob', 'other').toPromise();
    expect(ok2).toBeFalsy();
  });

  it('login should validate against registered accounts', async () => {
    await service.register('carol', 'pass').toPromise();
    let ok = await service.login('carol', 'pass').toPromise();
    expect(ok).toBeTruthy();
    expect(service.getUser()?.username).toBe('carol');

    ok = await service.login('carol', 'wrong').toPromise();
    expect(ok).toBeFalsy();

    ok = await service.login('unknown', 'pass').toPromise();
    expect(ok).toBeFalsy();
  });

  it('logout clears current user', async () => {
    await service.register('d', 'e').toPromise();
    await service.login('d', 'e').toPromise();
    expect(service.isLoggedIn()).toBeTruthy();
    service.logout();
    expect(service.isLoggedIn()).toBeFalsy();
    expect(service.getUser()).toBeNull();
  });

  describe('updateUser', () => {
    beforeEach(async () => {
      await service.register('foo', '1234').toPromise();
      await service.login('foo', '1234').toPromise();
    });

    it('should fail when current password is incorrect', () => {
      expect(service.updateUser('wrong', 'foo', 'new')).toBeFalsy();
    });

    it('should allow changing only the username', () => {
      expect(service.updateUser('1234', 'bar')).toBeTruthy();
      const user = service.getUser();
      expect(user?.username).toBe('bar');
      const all = JSON.parse(
        window.localStorage.getItem('kanban.users') || '[]'
      ) as any[];
      expect(all[0].username).toBe('bar');
    });

    it('should allow changing only the password', async () => {
      expect(service.updateUser('1234', 'foo', 'abcd')).toBeTruthy();
      service.logout();
      expect(await service.login('foo', 'abcd').toPromise()).toBeTruthy();
    });

    it('should prevent changing to a username that already exists', () => {
      service.register('other', 'pw').subscribe();
      expect(service.updateUser('1234', 'other')).toBeFalsy();
    });

    it('should trim new username and reject empty after trim', () => {
      expect(service.updateUser('1234', '   ')).toBeFalsy();
    });
  });

  describe('changeUsername', () => {
    beforeEach(async () => {
      await service.register('foo', '1234').toPromise();
      await service.login('foo', '1234').toPromise();
    });

    it('changes name when value is valid', () => {
      expect(service.changeUsername('bar')).toBeTruthy();
      expect(service.getUser()?.username).toBe('bar');
    });

    it('refuses empty or whitespace-only', () => {
      expect(service.changeUsername('   ')).toBeFalsy();
    });

    it('rejects names already in use', () => {
      service.register('other', 'pw').subscribe();
      expect(service.changeUsername('other')).toBeFalsy();
    });

    it('returns false when not logged in', () => {
      service.logout();
      expect(service.changeUsername('cow')).toBeFalsy();
    });
  });
});
