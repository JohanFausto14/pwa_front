import { useState } from 'react';
import './Dashboard.css';

interface User {
  username: string;
  name: string;
  role: string;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type TabType = 'drake' | 'eminem' | 'jcole' | 'kendrick' | 'tyler' | 'settings';

interface Song {
  name: string;
  album: string;
  year: number;
  duration: string;
  genre: string;
  producer: string;
  label: string;
  peakPosition: number;
  certifications: string;
  albumCover: string;
}

interface Rapper {
  name: string;
  realName: string;
  birthYear: number;
  origin: string;
  genre: string;
  label: string;
  photo: string;
  songs: Song[];
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('drake');

  const tabs = [
    { id: 'drake' as TabType, label: 'Drake', icon: '🎤' },
    { id: 'eminem' as TabType, label: 'Eminem', icon: '🎵' },
    { id: 'jcole' as TabType, label: 'J. Cole', icon: '🎶' },
    { id: 'kendrick' as TabType, label: 'Kendrick Lamar', icon: '🎧' },
    { id: 'tyler' as TabType, label: 'Tyler The Creator', icon: '🎸' },
    { id: 'settings' as TabType, label: 'Configuración', icon: '⚙️' }
  ];

  const rappersData: Record<TabType, Rapper> = {
    drake: {
      name: 'Drake',
      realName: 'Aubrey Drake Graham',
      birthYear: 1986,
      origin: 'Toronto, Canada',
      genre: 'Hip-Hop/R&B',
      label: 'OVO Sound',
      photo: 'https://s1.ticketm.net/dam/a/825/5a19e70e-3f4d-4162-983f-1f1c11f34825_TABLET_LANDSCAPE_LARGE_16_9.jpg',
      songs: [
        {
          name: 'God\'s Plan',
          album: 'Scorpion',
          year: 2018,
          duration: '3:19',
          genre: 'Hip-Hop',
          producer: 'Cardo, Yung Exclusive, Boi-1da',
          label: 'OVO Sound',
          peakPosition: 1,
          certifications: 'Diamond (US)',
          albumCover: 'https://shop.islandrecords.co.uk/cdn/shop/files/SharedImage-116390.png?v=1747820658'
        },
        {
          name: 'One Dance',
          album: 'Views',
          year: 2016,
          duration: '2:54',
          genre: 'Dancehall',
          producer: 'Nineteen85, Wizkid, Kyla',
          label: 'OVO Sound',
          peakPosition: 1,
          certifications: '6x Platinum (US)',
          albumCover: 'https://media.gq.com/photos/5728d775655ba1b13f3b86aa/1:1/w_1024,h_1024,c_limit/views-on-views--gen-01.jpg'
        },
        {
          name: 'Hotline Bling',
          album: 'Views',
          year: 2015,
          duration: '4:27',
          genre: 'R&B',
          producer: 'Nineteen85',
          label: 'OVO Sound',
          peakPosition: 2,
          certifications: '8x Platinum (US)',
          albumCover: 'https://www.turntablelab.com/cdn/shop/products/drake-views-blackvinyl-1_1000x1000.jpg?v=1653509309'
        },
        {
          name: 'In My Feelings',
          album: 'Scorpion',
          year: 2018,
          duration: '3:37',
          genre: 'Hip-Hop',
          producer: 'BlocBoy JB, Tay Keith',
          label: 'OVO Sound',
          peakPosition: 1,
          certifications: '6x Platinum (US)',
          albumCover: 'https://shop.islandrecords.co.uk/cdn/shop/files/SharedImage-116390.png?v=1747820658'
        },
        {
          "name": "Passionfruit",
          "album": "More Life",
          "year": 2017,
          "duration": "4:58",
          "genre": "Dancehall / R&B",
          "producer": "Nana Rogues",
          "label": "Young Money Entertainment / Cash Money Records",
          "peakPosition": 8,
          "certifications": "5x Platinum (US)",
          "albumCover": "https://cdn-images.dzcdn.net/images/cover/8f0187ad83cdd1f47f1c55420f9df227/1900x1900-000000-81-0-0.jpg" 
        }
      ]
    },
    eminem: {
      name: 'Eminem',
      realName: 'Marshall Bruce Mathers III',
      birthYear: 1972,
      origin: 'Detroit, Michigan',
      genre: 'Hip-Hop',
      label: 'Shady Records',
      photo: 'https://www.billboard.com/wp-content/uploads/2024/06/Eminem-press-credit-Travis-Shinn-2024-billboard-1548.jpg?w=1024',
      songs: [
        {
          name: 'Lose Yourself',
          album: '8 Mile Soundtrack',
          year: 2002,
          duration: '5:26',
          genre: 'Hip-Hop',
          producer: 'Eminem, Jeff Bass',
          label: 'Shady Records',
          peakPosition: 1,
          certifications: 'Diamond (US)',
          albumCover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtwDyq51Yj7-A-vffKBORMRKC7LzBPuPo-ww&s'
        },
        {
          name: 'Rap God',
          album: 'The Marshall Mathers LP 2',
          year: 2013,
          duration: '6:03',
          genre: 'Hip-Hop',
          producer: 'DVLP',
          label: 'Shady Records',
          peakPosition: 7,
          certifications: '6x Platinum (US)',
          albumCover: 'https://m.media-amazon.com/images/I/91E0tsoLNrL._UF1000,1000_QL80_.jpg'
        }
        ,
        {
          name: 'Not Afraid',
          album: 'Recovery',
          year: 2010,
          duration: '4:10',
          genre: 'Hip-Hop',
          producer: 'Boi-1da, Jordan Evans',
          label: 'Shady Records',
          peakPosition: 1,
          certifications: '6x Platinum (US)',
          albumCover: 'https://m.media-amazon.com/images/I/61fXEwg-lAL.jpg'
        },
        {
          name: 'The Real Slim Shady',
          album: 'The Marshall Mathers LP',
          year: 2000,
          duration: '4:44',
          genre: 'Hip-Hop',
          producer: 'Dr. Dre, Mel-Man',
          label: 'Shady Records',
          peakPosition: 4,
          certifications: '4x Platinum (US)',
          albumCover: 'https://2.bp.blogspot.com/-dwno-8V-R34/Vo3xPS0KW1I/AAAAAAAABos/aNieyFRR17M/s1600/The%2BMarshall%2BMathers%2BL.P..jpg'
        },
        {
          name: 'Without Me',
          album: 'The Eminem Show',
          year: 2002,
          duration: '4:50',
          genre: 'Hip-Hop',
          producer: 'Eminem, Jeff Bass',
          label: 'Shady Records',
          peakPosition: 2,
          certifications: '4x Platinum (US)',
          albumCover: 'https://m.media-amazon.com/images/I/410VJKV78VL._UF1000,1000_QL80_.jpg'
        }
      ]
    },
    jcole: {
      name: 'J. Cole',
      realName: 'Jermaine Lamarr Cole',
      birthYear: 1985,
      origin: 'Fayetteville, North Carolina',
      genre: 'Hip-Hop',
      label: 'Dreamville Records',
      photo: 'https://substackcdn.com/image/fetch/$s_!xx-z!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F118059c5-5e6f-46b5-869a-470a6e21af4b_1008x1108.png',
      songs: [
        {
          name: 'No Role Modelz',
          album: '2014 Forest Hills Drive',
          year: 2014,
          duration: '4:52',
          genre: 'Hip-Hop',
          producer: 'J. Cole, Phonix Beats',
          label: 'Dreamville Records',
          peakPosition: 36,
          certifications: '3x Platinum (US)',
          albumCover: 'https://i.scdn.co/image/ab67616d0000b273c6e0948bbb0681ff29cdbae8'
        },
        {
          name: 'Middle Child',
          album: 'Revenge of the Dreamers III',
          year: 2019,
          duration: '3:33',
          genre: 'Hip-Hop',
          producer: 'J. Cole, T-Minus',
          label: 'Dreamville Records',
          peakPosition: 4,
          certifications: '2x Platinum (US)',
          albumCover: 'https://m.media-amazon.com/images/I/61Lr47PKo8L._UF1000,1000_QL80_.jpg'
        },
        {
          name: 'Work Out',
          album: 'Cole World: The Sideline Story',
          year: 2011,
          duration: '3:43',
          genre: 'Hip-Hop',
          producer: 'J. Cole',
          label: 'Dreamville Records',
          peakPosition: 13,
          certifications: '2x Platinum (US)',
          albumCover: 'https://m.media-amazon.com/images/I/81Sgbb14OWL._UF1000,1000_QL80_.jpg'
        },
        {
          name: 'Power Trip',
          album: 'Born Sinner',
          year: 2013,
          duration: '4:00',
          genre: 'Hip-Hop',
          producer: 'J. Cole, Elite',
          label: 'Dreamville Records',
          peakPosition: 19,
          certifications: '2x Platinum (US)',
          albumCover: 'https://m.media-amazon.com/images/I/71P+5PcNfdL._UF1000,1000_QL80_.jpg'
        },
        {
          name: 'ATM',
          album: 'KOD',
          year: 2018,
          duration: '3:36',
          genre: 'Hip-Hop',
          producer: 'J. Cole',
          label: 'Dreamville Records',
          peakPosition: 6,
          certifications: 'Platinum (US)',
          albumCover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdLNgNYh33iOBF9_NOHT8ZvMaDTNJ-P8rKmw&s'
        }
      ]
    },
    kendrick: {
      name: 'Kendrick Lamar',
      realName: 'Kendrick Lamar Duckworth',
      birthYear: 1987,
      origin: 'Compton, California',
      genre: 'Hip-Hop',
      label: 'Top Dawg Entertainment',
      photo: 'https://i.pinimg.com/736x/17/71/34/17713418eb8d9624d4762da3510c83b0.jpg',
      songs: [
        {
          name: 'HUMBLE.',
          album: 'DAMN.',
          year: 2017,
          duration: '2:57',
          genre: 'Hip-Hop',
          producer: 'Mike Will Made It',
          label: 'Top Dawg Entertainment',
          peakPosition: 1,
          certifications: '8x Platinum (US)',
          albumCover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqQ0dV2DnTSfggszEZVOWx1dGnTfFDCqpvZA&s'
        },
        {
          name: 'DNA.',
          album: 'DAMN.',
          year: 2017,
          duration: '3:06',
          genre: 'Hip-Hop',
          producer: 'Mike Will Made It',
          label: 'Top Dawg Entertainment',
          peakPosition: 4,
          certifications: '4x Platinum (US)',
          albumCover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqQ0dV2DnTSfggszEZVOWx1dGnTfFDCqpvZA&s'
        },
        {
          name: 'All the Stars',
          album: 'Black Panther The Album Music From and Inspired By',
          year: 2018,
          duration: '3:52',
          genre: 'Hip-Hop, R&B',
          producer: 'Sounwave, Al Shux',
          label: 'Top Dawg Entertainment, Aftermath Entertainment, Interscope Records',
          peakPosition: 7,
          certifications: '3x Platinum (US)',
          albumCover: 'https://m.media-amazon.com/images/I/51XlJbrUjML._UF1000,1000_QL80_.jpg'
        },
        {
          name: 'Swimming Pools (Drank)',
          album: 'good kid, m.A.A.d city',
          year: 2012,
          duration: '5:13',
          genre: 'Hip-Hop',
          producer: 'T-Minus',
          label: 'Top Dawg Entertainment',
          peakPosition: 17,
          certifications: '3x Platinum (US)',
          albumCover: 'https://m.media-amazon.com/images/I/81EYtj8oi3L.jpg'
        },
        {
          name: 'Alright',
          album: 'To Pimp a Butterfly',
          year: 2015,
          duration: '3:39',
          genre: 'Hip-Hop',
          producer: 'Pharrell Williams',
          label: 'Top Dawg Entertainment',
          peakPosition: 81,
          certifications: '2x Platinum (US)',
          albumCover: 'https://m.media-amazon.com/images/I/81015y0a1hL._UF1000,1000_QL80_.jpg'
        }
      ]
    },
    tyler: {
      name: 'Tyler The Creator',
      realName: 'Tyler Gregory Okonma',
      birthYear: 1991,
      origin: 'Ladera Heights, California',
      genre: 'Hip-Hop/Alternative',
      label: 'Columbia Records',
      photo: 'https://i.pinimg.com/564x/6c/d5/e8/6cd5e88f5f35b4a39d85573d6276421d.jpg',
      songs: [
        {
          name: 'EARFQUAKE',
          album: 'IGOR',
          year: 2019,
          duration: '3:10',
          genre: 'Alternative R&B',
          producer: 'Tyler, The Creator',
          label: 'Columbia Records',
          peakPosition: 13,
          certifications: '2x Platinum (US)',
          albumCover: 'https://m.media-amazon.com/images/I/71UzjXRiGHL._UF1000,1000_QL80_.jpg'
        },
        {
          name: 'See You Again',
          album: 'Flower Boy',
          year: 2017,
          duration: '3:00',
          genre: 'Alternative R&B',
          producer: 'Tyler, The Creator',
          label: 'Columbia Records',
          peakPosition: 28,
          certifications: 'Platinum (US)',
          albumCover: 'https://cdn-images.dzcdn.net/images/cover/a7a16b8f63b1ec0e9fbd327619966737/0x1900-000000-80-0-0.jpg'
        },
        {
          name: 'Yonkers',
          album: 'Goblin',
          year: 2011,
          duration: '4:09',
          genre: 'Hip-Hop',
          producer: 'Tyler, The Creator',
          label: 'XL Recordings',
          peakPosition: 91,
          certifications: 'Gold (US)',
          albumCover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHz3-QN6pA5AMMux2SVGFwRziqaXndLteR2g&s'
        },
        {
          name: 'ARE WE STILL FRIENDS?',
          album: 'IGOR',
          year: 2019,
          duration: '4:25',
          genre: 'Alternative R&B, Neo-Soul',
          producer: 'Tyler, The Creator',
          label: 'Columbia Records',
          peakPosition: 68,
          certifications: 'Platinum (US)',
          albumCover: 'https://m.media-amazon.com/images/I/71UzjXRiGHL._UF1000,1000_QL80_.jpg'
        },
        {
          "name": "WUSYANAME",
          "album": "CALL ME IF YOU GET LOST",
          "year": 2021,
          "duration": "2:01",
          "genre": "R&B / Hip-Hop",
          "producer": "Tyler, The Creator",
          "label": "Columbia Records",
          "peakPosition": 12,
          "certifications": "2x Platinum (US)",
          "albumCover": "https://cdn.themedizine.com/2021/06/Tyler-The-Creator-Call-Me.jpg" 
        }
      ]
    },
    settings: {
      name: 'Settings',
      realName: '',
      birthYear: 0,
      origin: '',
      genre: '',
      label: '',
      photo: '',
      songs: []
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'drake':
        return <RapperTab rapper={rappersData.drake} />;
      case 'eminem':
        return <RapperTab rapper={rappersData.eminem} />;
      case 'jcole':
        return <RapperTab rapper={rappersData.jcole} />;
      case 'kendrick':
        return <RapperTab rapper={rappersData.kendrick} />;
      case 'tyler':
        return <RapperTab rapper={rappersData.tyler} />;
      case 'settings':
        return <SettingsTab onLogout={onLogout} />;
      default:
        return <RapperTab rapper={rappersData.drake} />;
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Rapper Dashboard</h1>
            <p className="header-subtitle">Mi PWA Alvarado Fausto Ari Johan</p>
          </div>
          <div className="user-info">
            <div className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="dashboard-content">
        {renderTabContent()}
      </main>
    </div>
  );
}

// Componente para la pestaña de Rapper
function RapperTab({ rapper }: { rapper: Rapper }) {
  if (rapper.name === 'Settings') return null;

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div className="rapper-header">
          <div className="rapper-photo">
            <img src={rapper.photo} alt={rapper.name} />
          </div>
          <div className="rapper-info">
            <h2>{rapper.name}</h2>
            <p className="rapper-real-name">{rapper.realName}</p>
            <div className="rapper-details">
              <div className="detail-item">
                <span className="detail-label">Origen:</span>
                <span className="detail-value">{rapper.origin}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Género:</span>
                <span className="detail-value">{rapper.genre}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Sello:</span>
                <span className="detail-value">{rapper.label}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Año de Nacimiento:</span>
                <span className="detail-value">{rapper.birthYear}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="songs-section">
        <h3>Top 5 Canciones Más Famosas</h3>
        <div className="songs-grid">
          {rapper.songs.map((song, index) => (
            <div key={index} className="song-card">
              <div className="song-album-cover">
                <img src={song.albumCover} alt={`${song.album} cover`} />
              </div>
              <div className="song-info">
                <h4 className="song-name">{song.name}</h4>
                <div className="song-details">
                  <div className="song-detail">
                    <span className="detail-label">Álbum:</span>
                    <span className="detail-value">{song.album}</span>
                  </div>
                  <div className="song-detail">
                    <span className="detail-label">Año:</span>
                    <span className="detail-value">{song.year}</span>
                  </div>
                  <div className="song-detail">
                    <span className="detail-label">Duración:</span>
                    <span className="detail-value">{song.duration}</span>
                  </div>
                  <div className="song-detail">
                    <span className="detail-label">Género:</span>
                    <span className="detail-value">{song.genre}</span>
                  </div>
                  <div className="song-detail">
                    <span className="detail-label">Productor:</span>
                    <span className="detail-value">{song.producer}</span>
                  </div>
                  <div className="song-detail">
                    <span className="detail-label">Sello:</span>
                    <span className="detail-value">{song.label}</span>
                  </div>
                  <div className="song-detail">
                    <span className="detail-label">Posición Máxima:</span>
                    <span className="detail-value">#{song.peakPosition}</span>
                  </div>
                  <div className="song-detail">
                    <span className="detail-label">Certificaciones:</span>
                    <span className="detail-value">{song.certifications}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// Componente para la pestaña de Configuración
function SettingsTab({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Configuración del Sistema</h2>
        <p>Gestiona la configuración de tu cuenta y preferencias</p>
      </div>
      
      <div className="settings-sections">
        <div className="settings-section">
          <h3>Configuración de Cuenta</h3>
          <div className="setting-item">
            <label>Notificaciones por email</label>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="setting-item">
            <label>Notificaciones push</label>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="setting-item">
            <label>Modo oscuro</label>
            <input type="checkbox" />
          </div>
          <div className="setting-item">
            <label>Idioma</label>
            <select>
              <option>Español</option>
              <option>English</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3>Configuración del Sistema</h3>
          <div className="setting-item">
            <label>Auto-guardado</label>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="setting-item">
            <label>Modo offline</label>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="setting-item">
            <label>Sincronización automática</label>
            <input type="checkbox" defaultChecked />
          </div>
        </div>

        <div className="settings-section">
          <h3>Seguridad</h3>
          <div className="setting-item">
            <label>Autenticación de dos factores</label>
            <input type="checkbox" />
          </div>
          <div className="setting-item">
            <label>Historial de sesiones</label>
            <input type="checkbox" defaultChecked />
          </div>
        </div>

        <div className="settings-section">
          <h3>Acciones</h3>
          <button className="logout-button" onClick={onLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
