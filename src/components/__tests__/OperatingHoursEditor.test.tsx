import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OperatingHoursEditor } from '../OperatingHoursEditor';

// Mock MUI X Date Pickers to avoid complexity
jest.mock('@mui/x-date-pickers/TimePicker', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TimePicker: ({ label, value, onChange }: any) => {
        const timeStr = value ? value.getHours().toString().padStart(2, '0') + ':' + value.getMinutes().toString().padStart(2, '0') : '';
        return (
            <div data-testid={`time-picker-${label}`}>
                <input
                    aria-label={label}
                    value={timeStr}
                    onChange={(e) => {
                        const [h, m] = e.target.value.split(':');
                        const d = new Date();
                        d.setHours(parseInt(h), parseInt(m), 0, 0);
                        onChange(d);
                    }}
                />
            </div>
        );
    }
}));

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    LocalizationProvider: ({ children }: any) => <div>{children}</div>
}));

jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
    AdapterDateFns: jest.fn()
}));

describe('OperatingHoursEditor component', () => {
    const defaultProps = {
        value: [
            { day: 'MON', start: '09:00', end: '13:00' },
            { day: 'MON', start: '14:00', end: '18:00' }
        ],
        onChange: jest.fn()
    };

    it('should render initial schedule from value', () => {
        render(<OperatingHoursEditor {...defaultProps} />);

        // Monday should be enabled (checked)
        const mondaySwitch = screen.getAllByRole('checkbox')[0]; // MON is first
        expect(mondaySwitch).toBeChecked();

        // Should see two time windows for Monday
        const startPickers = screen.getAllByLabelText('Inicio');
        expect(startPickers[0]).toHaveValue('09:00');
        expect(startPickers[1]).toHaveValue('14:00');
    });

    it('should toggle day state', () => {
        render(<OperatingHoursEditor {...defaultProps} />);

        // Tuesday (index 1) is currently disabled
        const tuesdaySwitch = screen.getAllByRole('checkbox')[1];
        expect(tuesdaySwitch).not.toBeChecked();

        fireEvent.click(tuesdaySwitch);

        expect(tuesdaySwitch).toBeChecked();
        expect(defaultProps.onChange).toHaveBeenCalled();
        // Should have added a default window 09:00-18:00
        expect(screen.getAllByLabelText('Inicio').length).toBe(3); // 2 from MON + 1 from TUE
    });

    it('should add a time window', () => {
        render(<OperatingHoursEditor {...defaultProps} />);

        const addButtons = screen.getAllByText('Agregar horario');
        fireEvent.click(addButtons[0]); // Add window to MON

        expect(defaultProps.onChange).toHaveBeenCalled();
        expect(screen.getAllByLabelText('Inicio').length).toBe(3);
    });

    it('should remove a time window', () => {
        render(<OperatingHoursEditor {...defaultProps} />);

        const deleteButtons = screen.getAllByTestId('DeleteIcon');
        fireEvent.click(deleteButtons[0].parentElement!); // Click the IconButton

        expect(defaultProps.onChange).toHaveBeenCalled();
        expect(screen.getAllByLabelText('Inicio').length).toBe(1);
    });

    it('should handle time changes', () => {
        render(<OperatingHoursEditor {...defaultProps} />);

        const startPickers = screen.getAllByLabelText('Inicio');
        fireEvent.change(startPickers[0], { target: { value: '10:00' } });

        expect(defaultProps.onChange).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ day: 'MON', start: '10:00' })
        ]));
    });
});
