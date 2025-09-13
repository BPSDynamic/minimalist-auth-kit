import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { storage } from './storage/resource';
import { data } from './data/resource';
import { fileProcessor } from './functions/fileProcessor/resource';
import { notificationService } from './functions/notificationService/resource';
import { analyticsService } from './functions/analyticsService/resource';
import { backupService } from './functions/backupService/resource';
import { folderService } from './functions/folderService/resource';
import { fileService } from './functions/fileService/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
export const backend = defineBackend({
  auth,
  storage,
  data,
  fileProcessor,
  notificationService,
  analyticsService,
  backupService,
  folderService,
  fileService,
});
