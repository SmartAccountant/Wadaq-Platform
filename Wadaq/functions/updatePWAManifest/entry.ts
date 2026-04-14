import { createClientFromRequest } from 'npm:@Wadaq/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const Wadaq = createClientFromRequest(req);
    
    const user = await Wadaq.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization info
    const organizations = await Wadaq.entities.Organization.filter({ owner_email: user.email });
    const org = organizations[0] || {};

    const companyName = org.name || 'ACCURIX';
    const companyLogo = org.logo || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/Wadaq-prod/public/6971dab01aac952606d6505f/5c1b2ad18_92490488-9162-457f-ad0c-6b04cd984bf6.png';

    // Generate PWA manifest
    const manifest = {
      name: companyName,
      short_name: companyName,
      description: "نظام محاسبي ذكي متكامل",
      start_url: "/Dashboard",
      display: "standalone",
      background_color: "#0f172a",
      theme_color: "#8b5cf6",
      orientation: "portrait-primary",
      icons: [
        {
          src: companyLogo,
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: companyLogo,
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    };

    return Response.json(manifest);

  } catch (error) {
    console.error('Error generating PWA manifest:', error);
    return Response.json({
      error: 'Failed to generate manifest',
      details: error.message
    }, { status: 500 });
  }
});