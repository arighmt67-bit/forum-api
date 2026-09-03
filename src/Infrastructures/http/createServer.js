import express from 'express';
import ClientError from '../../Commons/exceptions/ClientError.js';
import DomainErrorTranslator from '../../Commons/exceptions/DomainErrorTranslator.js';
import users from '../../Interfaces/http/api/users/index.js';
import authentications from '../../Interfaces/http/api/authentications/index.js';
import threads from '../../Interfaces/http/api/threads/index.js';
import comments from '../../Interfaces/http/api/comments/index.js';
import replies from '../../Interfaces/http/api/replies/index.js';

const createServer = async (container) => {
  const app = express();

  // Middleware for parsing JSON
  app.use(express.json());

  // Register routes
  app.use('/users', users(container));
  app.use('/authentications', authentications(container));
  app.use('/threads', threads(container));
  app.use('/threads/:threadId/comments', comments(container));
  app.use('/threads/:threadId/comments/:commentId/replies', replies(container));

  // Global error handler
  // eslint-disable-next-line no-unused-vars -- Express mengenali error handler dari 4 argumen
  app.use((error, req, res, next) => {
    // bila response tersebut error, tangani sesuai kebutuhan
    const translatedError = DomainErrorTranslator.translate(error);

    // penanganan client error secara internal.
    if (translatedError instanceof ClientError) {
      return res.status(translatedError.statusCode).json({
        status: 'fail',
        message: translatedError.message,
      });
    }

    // penanganan server error sesuai kebutuhan
    return res.status(500).json({
      status: 'error',
      message: 'terjadi kegagalan pada server kami',
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      status: 'fail',
      message: 'Route not found',
    });
  });

  return app;
};

export default createServer;
