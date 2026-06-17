import { MessageFormat } from '../../tcp/features/message-format.model';

export type SendMessage = {
  connectionId?: string;
  data: string;
  format: MessageFormat;
};
