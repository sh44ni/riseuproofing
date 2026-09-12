import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Graceful fallback data
const FALLBACK_DATA = {
  location: 'Oceanside, CA',
  localtime: new Date().toISOString(),
  current: {
    temp_f: 72,
    feelslike_f: 70,
    humidity: 58,
    wind_mph: 8,
    wind_dir: 'NW',
    uv: 5,
    precip_in: 0,
    vis_miles: 10,
    cloud: 20,
    is_day: 1,
    condition: { text: 'Sunny', icon: '//cdn.weatherapi.com/weather/64x64/day/113.png', code: 1000 },
    air_quality: { us_epa_index: 1, pm2_5: 5.2 },
  },
  forecast: [
    {
      date: new Date(Date.now()).toISOString().split('T')[0],
      maxtemp_f: 76, mintemp_f: 62, avgtemp_f: 69,
      daily_chance_of_rain: 0,
      condition: { text: 'Sunny', icon: '//cdn.weatherapi.com/weather/64x64/day/113.png' },
      sunrise: '6:28 AM', sunset: '7:11 PM', uv: 5,
    },
    {
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      maxtemp_f: 74, mintemp_f: 60, avgtemp_f: 67,
      daily_chance_of_rain: 10,
      condition: { text: 'Partly Cloudy', icon: '//cdn.weatherapi.com/weather/64x64/day/116.png' },
      sunrise: '6:29 AM', sunset: '7:10 PM', uv: 4,
    },
    {
      date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      maxtemp_f: 68, mintemp_f: 58, avgtemp_f: 63,
      daily_chance_of_rain: 30,
      condition: { text: 'Cloudy', icon: '//cdn.weatherapi.com/weather/64x64/day/119.png' },
      sunrise: '6:30 AM', sunset: '7:09 PM', uv: 3,
    },
  ],
  hourly: Array.from({ length: 12 }, (_, i) => ({
    time: `${(i + 8) % 24}:00`,
    temp_f: 68 + Math.round(Math.sin((i / 12) * Math.PI) * 8),
    chance_of_rain: i > 9 ? 20 : 0,
    condition: 'Sunny',
  })),
  isFallback: true,
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') || 'Oceanside, CA';
  const apiKey = process.env.WEATHER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ ...FALLBACK_DATA, isFallback: true }, { status: 200 });
  }

  try {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=3&aqi=yes&alerts=no`;

    const res = await fetch(url, { next: { revalidate: 1800 } });

    if (!res.ok) {
      throw new Error(`WeatherAPI error: ${res.status}`);
    }

    const raw = await res.json();

    const localtime: string = raw.location?.localtime ?? '';
    const currentHour = parseInt(localtime.split(' ')[1]?.split(':')[0] ?? '12', 10);
    const todayHours: any[] = raw.forecast?.forecastday?.[0]?.hour ?? [];
    const nextHours = todayHours
      .filter((h: any) => parseInt(h.time.split(' ')[1], 10) >= currentHour)
      .slice(0, 12)
      .map((h: any) => ({
        time: h.time.split(' ')[1],
        temp_f: Math.round(h.temp_f),
        chance_of_rain: h.chance_of_rain,
        condition: h.condition?.text ?? '',
      }));

    const shaped = {
      location: `${raw.location.name}, ${raw.location.region}`,
      localtime: raw.location.localtime,
      current: {
        temp_f: Math.round(raw.current.temp_f),
        feelslike_f: Math.round(raw.current.feelslike_f),
        humidity: raw.current.humidity,
        wind_mph: Math.round(raw.current.wind_mph),
        wind_dir: raw.current.wind_dir,
        uv: raw.current.uv,
        precip_in: raw.current.precip_in,
        vis_miles: raw.current.vis_miles,
        cloud: raw.current.cloud,
        is_day: raw.current.is_day,
        condition: {
          text: raw.current.condition.text,
          icon: raw.current.condition.icon,
          code: raw.current.condition.code,
        },
        air_quality: raw.current.air_quality
          ? {
              us_epa_index: raw.current.air_quality['us-epa-index'] ?? 1,
              pm2_5: Math.round((raw.current.air_quality.pm2_5 ?? 0) * 10) / 10,
            }
          : null,
      },
      forecast: (raw.forecast?.forecastday ?? []).map((fd: any) => ({
        date: fd.date,
        maxtemp_f: Math.round(fd.day.maxtemp_f),
        mintemp_f: Math.round(fd.day.mintemp_f),
        avgtemp_f: Math.round(fd.day.avgtemp_f),
        daily_chance_of_rain: fd.day.daily_chance_of_rain,
        condition: { text: fd.day.condition.text, icon: fd.day.condition.icon },
        sunrise: fd.astro.sunrise,
        sunset: fd.astro.sunset,
        uv: fd.day.uv,
      })),
      hourly: nextHours,
      isFallback: false,
    };

    return NextResponse.json(shaped, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    });
  } catch (err) {
    console.error('[WeatherAPI] Fetch failed, using fallback:', err);
    return NextResponse.json({ ...FALLBACK_DATA, isFallback: true }, { status: 200 });
  }
}
