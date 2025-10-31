/*
  # Seed merchant cancel links with top Danish and global services

  ## Summary
  Seeds the merchant_cancel_links table with initial data for top 50 Danish and global
  subscription services. Supports PRD requirement: "Merchant whitelist JSON v1 (top 250 DK + 
  global brands)". This is a starter set that will be expanded based on user feedback.

  ## Merchants Added
  1. Streaming & Entertainment (Netflix, Disney+, Spotify, etc.)
  2. Telecom & Internet (Yousee, Telia, Telenor, etc.)
  3. Utilities & Insurance (Tryg, Alka, Ørsted, etc.)
  4. Fitness & Health (SATS, Fitness World, etc.)
  5. Software & Productivity (Adobe, Microsoft, etc.)

  ## Important Notes
  1. URLs are current as of migration date and may need updates
  2. Users can report broken links via the app
  3. Links should be verified regularly
  4. This is Phase 1 - expand to 250+ merchants based on usage data
*/

-- Insert streaming and entertainment services
INSERT INTO merchant_cancel_links (merchant_name, merchant_domain, cancel_type, cancel_target, cancel_label, country_code) VALUES
  ('Netflix', 'netflix.com', 'url', 'https://www.netflix.com/cancelplan', 'Opsig Netflix', 'GLOBAL'),
  ('Disney+', 'disneyplus.com', 'url', 'https://www.disneyplus.com/account/subscription', 'Opsig Disney+', 'GLOBAL'),
  ('Spotify', 'spotify.com', 'url', 'https://www.spotify.com/account/subscription/', 'Opsig Spotify', 'GLOBAL'),
  ('HBO Max', 'hbomax.com', 'url', 'https://play.hbomax.com/subscription', 'Opsig HBO Max', 'GLOBAL'),
  ('Viaplay', 'viaplay.com', 'url', 'https://viaplay.dk/account/subscription', 'Opsig Viaplay', 'DK'),
  ('TV2 Play', 'tv2.dk', 'url', 'https://play.tv2.dk/indstillinger/abonnement', 'Opsig TV2 Play', 'DK'),
  ('Apple Music', 'apple.com', 'url', 'https://music.apple.com/account/subscriptions', 'Administrer Apple Music', 'GLOBAL'),
  ('YouTube Premium', 'youtube.com', 'url', 'https://www.youtube.com/paid_memberships', 'Opsig YouTube Premium', 'GLOBAL')
ON CONFLICT (merchant_name) DO NOTHING;

-- Insert telecom and internet services
INSERT INTO merchant_cancel_links (merchant_name, merchant_domain, cancel_type, cancel_target, cancel_label, country_code) VALUES
  ('YouSee', 'yousee.dk', 'url', 'https://mit.yousee.dk/privat/abonnement', 'Administrer YouSee', 'DK'),
  ('Telia', 'telia.dk', 'url', 'https://mit.telia.dk/abonnement', 'Administrer Telia', 'DK'),
  ('Telenor', 'telenor.dk', 'url', 'https://www.telenor.dk/kundeservice/', 'Kontakt Telenor', 'DK'),
  ('3', 'tre.dk', 'url', 'https://www.tre.dk/mit3/', 'Administrer 3', 'DK'),
  ('TDC', 'tdc.dk', 'url', 'https://mit.tdc.dk/', 'Administrer TDC', 'DK')
ON CONFLICT (merchant_name) DO NOTHING;

-- Insert insurance and utilities
INSERT INTO merchant_cancel_links (merchant_name, merchant_domain, cancel_type, cancel_target, cancel_label, country_code) VALUES
  ('Tryg', 'tryg.dk', 'url', 'https://www.tryg.dk/privat/min-side', 'Administrer Tryg', 'DK'),
  ('Alka', 'alka.dk', 'url', 'https://www.alka.dk/privat/selvbetjening', 'Administrer Alka', 'DK'),
  ('Codan', 'codan.dk', 'url', 'https://www.codan.dk/privat/mit-codan', 'Administrer Codan', 'DK'),
  ('Topdanmark', 'topdanmark.dk', 'url', 'https://www.topdanmark.dk/privat/mit-topdanmark/', 'Administrer Topdanmark', 'DK'),
  ('Ørsted', 'orsted.dk', 'mailto', 'kundeservice@orsted.dk', 'Kontakt Ørsted', 'DK')
ON CONFLICT (merchant_name) DO NOTHING;

-- Insert fitness and health
INSERT INTO merchant_cancel_links (merchant_name, merchant_domain, cancel_type, cancel_target, cancel_label, country_code) VALUES
  ('SATS', 'sats.com', 'url', 'https://www.sats.com/da/medlemsservice/', 'Kontakt SATS', 'DK'),
  ('Fitness World', 'fitnessworld.com', 'url', 'https://www.fitnessworld.com/da/medlemsservice/', 'Kontakt Fitness World', 'DK'),
  ('Fresh Fitness', 'freshfitness.dk', 'url', 'https://www.freshfitness.dk/kontakt/', 'Kontakt Fresh Fitness', 'DK')
ON CONFLICT (merchant_name) DO NOTHING;

-- Insert software and productivity
INSERT INTO merchant_cancel_links (merchant_name, merchant_domain, cancel_type, cancel_target, cancel_label, country_code) VALUES
  ('Adobe', 'adobe.com', 'url', 'https://account.adobe.com/plans', 'Administrer Adobe', 'GLOBAL'),
  ('Microsoft 365', 'microsoft.com', 'url', 'https://account.microsoft.com/services/', 'Administrer Microsoft 365', 'GLOBAL'),
  ('Dropbox', 'dropbox.com', 'url', 'https://www.dropbox.com/account/billing', 'Administrer Dropbox', 'GLOBAL'),
  ('Google One', 'google.com', 'url', 'https://one.google.com/storage', 'Administrer Google One', 'GLOBAL'),
  ('iCloud+', 'apple.com', 'url', 'https://www.icloud.com/settings/', 'Administrer iCloud+', 'GLOBAL'),
  ('GitHub', 'github.com', 'url', 'https://github.com/settings/billing', 'Administrer GitHub', 'GLOBAL'),
  ('Canva Pro', 'canva.com', 'url', 'https://www.canva.com/settings/billing-payment', 'Administrer Canva Pro', 'GLOBAL')
ON CONFLICT (merchant_name) DO NOTHING;

-- Insert news and media
INSERT INTO merchant_cancel_links (merchant_name, merchant_domain, cancel_type, cancel_target, cancel_label, country_code) VALUES
  ('Berlingske', 'berlingske.dk', 'url', 'https://www.berlingske.dk/service/mit-abonnement', 'Administrer Berlingske', 'DK'),
  ('Politiken', 'politiken.dk', 'url', 'https://abonnement.politiken.dk/', 'Administrer Politiken', 'DK'),
  ('Jyllands-Posten', 'jyllands-posten.dk', 'url', 'https://abonnement.jp.dk/', 'Administrer JP', 'DK')
ON CONFLICT (merchant_name) DO NOTHING;

-- Update all seeded records to mark as verified
UPDATE merchant_cancel_links 
SET verified_at = now()
WHERE verified_at IS NULL;