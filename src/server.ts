import { app } from './app';
import { env } from './config/env';

app.listen(env.port, '0.0.0.0', () => {
  console.log(`Shopora API running on http://0.0.0.0:${env.port}`);
});
