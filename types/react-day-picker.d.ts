declare module 'react-day-picker' {
  import { ReactNode } from 'react';

  export interface DateRange {
    from?: Date;
    to?: Date;
  }

  export interface DayPickerProps {
    mode?: 'single' | 'multiple' | 'range' | 'default';
    selected?: Date | Date[] | DateRange | undefined;
    onSelect?: (date: Date | Date[] | DateRange | undefined) => void;
    locale?: any;
    className?: string;
    modifiersClassNames?: {
      selected?: string;
      today?: string;
      [key: string]: string | undefined;
    };
    [key: string]: any;
  }

  export function DayPicker(props: DayPickerProps): JSX.Element;
} 