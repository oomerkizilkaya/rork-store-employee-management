import { UserPosition } from '@/types';

export const getPositionLabel = (position: UserPosition): string => {
  const labels: Record<UserPosition, string> = {
    servis_personeli: 'Servis Personeli',
    barista: 'Barista',
    supervisor: 'Süpervizör',
    mudur_yardimcisi: 'Müdür Yardımcısı',
    magaza_muduru: 'Mağaza Müdürü',
    bolge_muduru: 'Bölge Müdürü',
    egitmen: 'Eğitmen',
    egitim_muduru: 'Eğitim Müdürü',
    insan_kaynaklari: 'İnsan Kaynakları',
  };
  return labels[position];
};

export const positionOptions: { label: string; value: UserPosition }[] = [
  { label: 'Servis Personeli', value: 'servis_personeli' },
  { label: 'Barista', value: 'barista' },
  { label: 'Süpervizör', value: 'supervisor' },
  { label: 'Müdür Yardımcısı', value: 'mudur_yardimcisi' },
  { label: 'Mağaza Müdürü', value: 'magaza_muduru' },
  { label: 'Bölge Müdürü', value: 'bolge_muduru' },
  { label: 'Eğitmen', value: 'egitmen' },
  { label: 'Eğitim Müdürü', value: 'egitim_muduru' },
  { label: 'İnsan Kaynakları', value: 'insan_kaynaklari' },
];
