
import { useEffect } from 'react';
import { Hammer, Building, Shield, Banknote, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useBrand, Brand } from '@/hooks/useBrand';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const iconMap: Record<string, JSX.Element> = {
  hammer: <Hammer className="h-4 w-4" />,
  building: <Building className="h-4 w-4" />,
  shield: <Shield className="h-4 w-4" />,
  banknote: <Banknote className="h-4 w-4" />,
};

const RESERVED_ROUTES = new Set([
  'campaigns',
  'partners',
  'conversations',
  'uploads',
  'manage-partners',
  'lookups',
  'lead-pricing',
  'lead-partners',
  'postcode-dekking',
  'leads-buiten-regio',
  'settings',
  'weekly-performance',
  'evolution',
  'rapportage',
]);

export function BrandSelector() {
  const { selectedBrand, brands, setBrands, setSelectedBrand } = useBrand();
  const navigate = useNavigate();
  const location = useLocation();
  const { brandSlug, partnerId } = useParams();

  useEffect(() => {
    const fetchBrands = async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');

      if (data && !error) {
        const formattedBrands: Brand[] = data.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          color: b.color || '#3b82f6',
          icon: b.icon || 'hammer',
        }));
        setBrands(formattedBrands);

        // If a brand is forced by URL, don't override it with a default.
        if (brandSlug) return;

        // Set default brand if none selected or current selection not in list
        const isValidBrand =
          selectedBrand && formattedBrands.some((b) => b.id === selectedBrand.id);
        if (!isValidBrand && formattedBrands.length > 0) {
          setSelectedBrand(formattedBrands[0]);
        }
      }
    };

    fetchBrands();
  }, [setBrands, setSelectedBrand, brandSlug, selectedBrand]);

  // Keep selected brand in sync with URL when routes include a brandSlug
  useEffect(() => {
    if (!brandSlug || brands.length === 0) return;

    const match = brands.find((b) => b.slug === brandSlug);
    if (match && (!selectedBrand || selectedBrand.id !== match.id)) {
      setSelectedBrand(match);
    }
  }, [brandSlug, brands, selectedBrand, setSelectedBrand]);

  const navigateToBrand = (slug: string) => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);
    const first = parts[0] ?? '';

    // Index routes: "/" and "/:brandSlug" (e.g. "/verbouwingen")
    if (path === '/' || (parts.length === 1 && !RESERVED_ROUTES.has(first))) {
      navigate(`/${slug}`);
      return;
    }

    // Brand-aware routes
    if (first === 'campaigns') {
      navigate(`/campaigns/${slug}`);
      return;
    }

    if (first === 'postcode-dekking') {
      navigate(`/postcode-dekking/${slug}`);
      return;
    }

    if (first === 'leads-buiten-regio') {
      navigate(`/leads-buiten-regio/${slug}`);
      return;
    }

    if (first === 'weekly-performance') {
      navigate(`/weekly-performance/${slug}`);
      return;
    }

    if (first === 'evolution') {
      navigate(`/evolution/${slug}`);
      return;
    }

    if (first === 'rapportage') {
      navigate(`/rapportage/${slug}`);
      return;
    }

    if (first === 'partners') {
      navigate(`/partners/brand/${slug}${partnerId ? `/${partnerId}` : ''}`);
      return;
    }

    // Other pages don't have brand routes; keep user on the same page.
  };

  const handleSelectBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    navigateToBrand(brand.slug);
  };

  if (!selectedBrand) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2 border-border/50 bg-card/50 hover:bg-card"
        >
          <span
            className="flex items-center justify-center w-6 h-6 rounded"
            style={{
              backgroundColor: selectedBrand.color + '20',
              color: selectedBrand.color,
            }}
          >
            {iconMap[selectedBrand.icon]}
          </span>
          <span className="font-medium">{selectedBrand.name}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-popover">
        {brands.map((brand) => (
          <DropdownMenuItem
            key={brand.id}
            onSelect={() => handleSelectBrand(brand)}
            className={`flex items-center gap-3 cursor-pointer ${
              selectedBrand.id === brand.id ? 'bg-primary/20 text-foreground' : ''
            }`}
          >
            <span
              className="flex items-center justify-center w-6 h-6 rounded"
              style={{ backgroundColor: brand.color + '20', color: brand.color }}
            >
              {iconMap[brand.icon]}
            </span>
            <span className="text-foreground">{brand.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
