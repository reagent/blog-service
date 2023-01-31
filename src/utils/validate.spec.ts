import { IsNotEmpty, IsEmail } from 'class-validator';
import { validate } from './validate';

class User {
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  name!: string;
}

describe(validate.name, () => {
  it('maps multiple errors on a key to a single error key', async () => {
    const user = new User();
    user.name = 'John';

    const errors = await validate(user);

    expect(errors).toEqual({
      email: ['email must be an email', 'email should not be empty'],
    });
  });

  it('maps errors from multiple keys', async () => {
    const user = new User();
    user.email = 'bogus';
    const errors = await validate(user);

    expect(errors).toEqual({
      email: ['email must be an email'],
      name: ['name should not be empty'],
    });
  });

  it('returns `null` when there are no errors', async () => {
    const user = new User();
    user.name = 'John';
    user.email = 'user@host.example';

    const errors = await validate(user);
    expect(errors).toBeNull();
  });
});
