import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HomePage from './page';

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />);
    
    const heading = screen.getByRole('heading', { 
      name: /phyllotaxis planner/i 
    });
    expect(heading).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<HomePage />);
    
    const description = screen.getByText(/植物の葉序の法則を応用した/);
    expect(description).toBeInTheDocument();
  });

  it('renders feature cards', () => {
    render(<HomePage />);
    
    expect(screen.getByText('自然な配置')).toBeInTheDocument();
    expect(screen.getByText('直感的な操作')).toBeInTheDocument();
    expect(screen.getByText('視覚的な美しさ')).toBeInTheDocument();
  });

  it('renders the start button', () => {
    render(<HomePage />);
    
    const startButton = screen.getByRole('button', { 
      name: /アプリを開始/i 
    });
    expect(startButton).toBeInTheDocument();
  });

  it('renders the footer', () => {
    render(<HomePage />);
    
    const footer = screen.getByText(/© 2024 Phyllotaxis Planner Team/);
    expect(footer).toBeInTheDocument();
  });
});