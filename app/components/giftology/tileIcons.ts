import baby from '../../assets/images/baby.svg';
import cake from '../../assets/images/cake.svg';
import envelope from '../../assets/images/envelope.svg';
import gift from '../../assets/images/gift.svg';
import tag from '../../assets/images/tag.svg';
import tie from '../../assets/images/tie.svg';

/** Brand icons a category tile can pick (`gly_tileN_icon`), by option value. */
export const TILE_ICONS: Record<string, string> = { baby, gift, cake, tie, tag, envelope };

/** The icons by name, for code that picks one itself. */
export type BrandIconName = 'baby' | 'gift' | 'cake' | 'tie' | 'tag' | 'envelope';
