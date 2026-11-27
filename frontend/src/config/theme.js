export const APP_THEMES = {
  light: {
    background: '#FFFFFF',
    surface: '#F7F5F2',
    text: '#292521',
    muted: '#756E66',
    accent: '#A5673F',
    accentSoft: '#F1E7DC',
    border: '#E8E2DC',
    white: '#FFFFFF',
    scrim: 'rgba(25, 22, 19, 0.55)',
  },
  dark: {
    background: '#17191C',
    surface: '#24272B',
    text: '#F1EEE8',
    muted: '#B3ADA4',
    accent: '#D49A6A',
    accentSoft: '#3A3028',
    border: '#3A3D42',
    white: '#FFFFFF',
    scrim: 'rgba(0, 0, 0, 0.72)',
  },
};

export const APP_THEME_OPTIONS = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

export const COLORS = APP_THEMES.light;

export const READER_THEMES = {
  paper: {
    label: 'Claro',
    background: '#FFFFFF',
    surface: '#F7F5F2',
    text: '#292521',
    muted: '#756E66',
    accent: '#A5673F',
    border: '#E8E2DC',
  },
  sepia: {
    label: 'Sepia',
    background: '#F4ECD8',
    surface: '#EAE0C8',
    text: '#41382D',
    muted: '#776A57',
    accent: '#986443',
    border: '#DCD0B7',
  },
  night: {
    label: 'Oscuro',
    background: '#17191C',
    surface: '#24272B',
    text: '#F1EEE8',
    muted: '#B3ADA4',
    accent: '#D49A6A',
    border: '#3A3D42',
  },
};
