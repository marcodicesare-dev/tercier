# TripAdvisor API Response Schemas (Verified Live — March 28, 2026)

All responses verified with live API calls. These are REAL responses, not documentation examples.

---

## Location Search Response

**Call:** `GET /location/search?searchQuery=Baur+au+Lac+Zurich&category=hotels&language=en`

```json
{
  "data": [
    {
      "location_id": "196060",
      "name": "Baur Au Lac",
      "address_obj": {
        "street1": "Talstrasse 1",
        "city": "Zurich",
        "country": "Switzerland",
        "postalcode": "8001",
        "address_string": "Talstrasse 1, Zurich 8001 Switzerland"
      }
    }
  ]
}
```

**Notes:** Returns up to 10 results. Results include hotels from other countries if name matches (e.g., "Au Lac" hotels in Vietnam appeared in results).

---

## Nearby Search Response

**Call:** `GET /location/nearby_search?latLong=47.3769,8.5417&category=hotels&radius=5&radiusUnit=km`

```json
{
  "data": [
    {
      "location_id": "205990",
      "name": "Central Plaza Hotel",
      "distance": "0.09658114263499575",
      "bearing": "east",
      "address_obj": {
        "street1": "Central 1",
        "city": "Zurich",
        "country": "Switzerland",
        "postalcode": "8001",
        "address_string": "Central 1, Zurich 8001 Switzerland"
      }
    }
  ]
}
```

**Notes:** `distance` is a string (not number) in km. `bearing` is compass direction (north, south, east, west, northeast, etc.). Up to 10 results.

---

## Location Details Response (FULL)

**Call:** `GET /location/196060/details?language=en&currency=CHF`

```json
{
  "location_id": "196060",
  "name": "Baur Au Lac",
  "description": "Since 1844, the hotel has witnessed some of the most iconic moments of time...",
  "web_url": "https://www.tripadvisor.com/Hotel_Review-g188113-d196060-Reviews-Baur_Au_Lac-Zurich.html?m=66827",
  "address_obj": {
    "street1": "Talstrasse 1",
    "city": "Zurich",
    "country": "Switzerland",
    "postalcode": "8001",
    "address_string": "Talstrasse 1, Zurich 8001 Switzerland"
  },
  "ancestors": [
    { "level": "Municipality", "name": "Zurich", "location_id": "188113" },
    { "level": "Canton", "name": "Canton of Zurich", "location_id": "188111" },
    { "level": "Country", "name": "Switzerland", "location_id": "188045" }
  ],
  "latitude": "47.367363",
  "longitude": "8.539124",
  "timezone": "Europe/Zurich",
  "write_review": "https://www.tripadvisor.com/UserReview-g188113-d196060-Baur_Au_Lac-Zurich.html?m=66827",
  "ranking_data": {
    "geo_location_id": "188113",
    "ranking_string": "#9 of 152 hotels in Zurich",
    "geo_location_name": "Zurich",
    "ranking_out_of": "152",
    "ranking": "9"
  },
  "rating": "4.7",
  "rating_image_url": "https://www.tripadvisor.com/img/cdsi/img2/ratings/traveler/4.5-66827-5.svg",
  "num_reviews": "1179",
  "review_rating_count": {
    "1": "22",
    "2": "25",
    "3": "42",
    "4": "113",
    "5": "977"
  },
  "subratings": {
    "0": { "name": "rate_location", "localized_name": "Location", "value": "4.9" },
    "1": { "name": "rate_sleep", "localized_name": "Sleep Quality", "value": "4.8" },
    "2": { "name": "rate_room", "localized_name": "Rooms", "value": "4.8" },
    "3": { "name": "rate_service", "localized_name": "Service", "value": "4.7" },
    "4": { "name": "rate_value", "localized_name": "Value", "value": "4.2" },
    "5": { "name": "rate_cleanliness", "localized_name": "Cleanliness", "value": "4.9" }
  },
  "photo_count": "959",
  "see_all_photos": "https://www.tripadvisor.com/Hotel_Review-g188113-d196060-m66827-Reviews-Baur_Au_Lac-Zurich.html#photos",
  "price_level": "$$$$",
  "amenities": [
    "Internet", "Free Internet", "Free Wifi", "Suites", "Accessible rooms",
    "Non-smoking rooms", "Public Wifi", "Dry Cleaning", "Meeting rooms",
    "Laundry Service", "Concierge", "Air conditioning", "Minibar",
    "Room service", "Restaurant", "Bar/Lounge", "Pets Allowed", "Wifi",
    "Business center", "Fitness center", "Banquet Room", "Family Rooms",
    "Multilingual Staff", "Conference Facilities", "Babysitting", "Safe",
    "Flatscreen TV", "Breakfast Buffet", "Private Balcony", "Butler Service",
    "Breakfast Available", "Parking", "Facilities for Disabled Guests",
    "Housekeeping", "Arabic", "Baggage Storage", "Bathrobes",
    "Blackout Curtains", "Breakfast in the Room", "Bridal Suite",
    "24-Hour Check-in", "Desk", "Doorperson", "English",
    "Facial Treatments", "Complimentary Toiletries", "French",
    "24-Hour Front Desk", "German", "Hair Dryer", "Ironing Service",
    "Laptop Safe", "Massage", "Newspaper", "Salon", "24-Hour Security",
    "Soundproof Rooms", "Spanish", "Special Diet Menus", "Telephone",
    "Valet Parking", "Wake Up Service / Alarm Clock", "Airport transportation",
    "Electric vehicle charging station", "Air Purifier", "Allergy-free Room",
    "Bidet", "Books, DVDs, Music for Children", "Express Check-in / Check-out",
    "Children's Television Networks", "Coffee Shop", "Currency Exchange",
    "Extra Long Beds", "First Aid Kit", "Fitness / Spa Locker Rooms",
    "Free Wifi in the Business Center", "Gift Shop", "Greek",
    "Highchairs Available", "Infirmary", "Interconnected room(s) available",
    "Landmark View", "Makeup Services", "Manicure", "Mountain View",
    "On-Demand Movies", "Pedicure", "Personal Trainer", "Private Bathrooms",
    "Private Check-in / Check-out", "Radio", "Russian", "Secured Parking",
    "Shoeshine", "Sofa", "Tile / Marble Floor", "VIP Room Facilities",
    "Waxing Services", "Photo Copier / Fax In Business Center", "Beach Access"
  ],
  "parent_brand": "The Leading Hotels of the World, Ltd",
  "brand": "The Leading Hotels of the World",
  "category": { "name": "hotel", "localized_name": "Hotel" },
  "subcategory": [{ "name": "hotel", "localized_name": "Hotel" }],
  "styles": [],
  "neighborhood_info": [],
  "trip_types": [
    { "name": "business", "localized_name": "Business", "value": "267" },
    { "name": "couples", "localized_name": "Couples", "value": "398" },
    { "name": "solo", "localized_name": "Solo travel", "value": "88" },
    { "name": "family", "localized_name": "Family", "value": "208" },
    { "name": "friends", "localized_name": "Friends getaway", "value": "89" }
  ],
  "awards": [
    {
      "award_type": "Travelers Choice",
      "year": "2025",
      "images": {
        "tiny": "https://static.tacdn.com/img2/travelers_choice/widgets/tchotel_2025_L.png",
        "small": "https://static.tacdn.com/img2/travelers_choice/widgets/tchotel_2025_L.png",
        "large": "https://static.tacdn.com/img2/travelers_choice/widgets/tchotel_2025_L.png"
      },
      "categories": [],
      "display_name": "Travelers Choice"
    }
  ]
}
```

---

## Location Reviews Response

**Call:** `GET /location/196060/reviews?language=en&limit=5&offset=0`

```json
{
  "data": [
    {
      "id": 1050138220,
      "lang": "en",
      "location_id": 196060,
      "published_date": "2026-02-18T07:44:56Z",
      "rating": 5,
      "helpful_votes": 0,
      "rating_image_url": "https://www.tripadvisor.com/img/cdsi/img2/ratings/traveler/s5.0-66827-5.svg",
      "url": "https://www.tripadvisor.com/ShowUserReviews-g188113-d196060-r1050138220-Reviews-Baur_Au_Lac-Zurich.html?m=66827#review1050138220",
      "text": "My preferred hotel in Zurich. Perfect location, outstanding service, and a beautiful property with a long history as the city's leading hotel...",
      "title": "No. 1 in Zurich",
      "trip_type": "Couples",
      "travel_date": "2026-02-28",
      "user": {
        "username": "tcitterio",
        "user_location": { "id": "null" },
        "avatar": {
          "thumbnail": "https://media-cdn.tripadvisor.com/media/photo-t/32/7a/55/95/caption.jpg",
          "small": "https://media-cdn.tripadvisor.com/media/photo-l/32/7a/55/95/caption.jpg",
          "medium": "https://media-cdn.tripadvisor.com/media/photo-f/32/7a/55/95/caption.jpg",
          "large": "https://media-cdn.tripadvisor.com/media/photo-p/32/7a/55/95/caption.jpg",
          "original": "https://media-cdn.tripadvisor.com/media/photo-m/1280/32/7a/55/95/caption.jpg"
        }
      },
      "subratings": {
        "0": { "name": "RATE_VALUE", "value": 5, "localized_name": "Value" },
        "1": { "name": "RATE_ROOM", "value": 5, "localized_name": "Rooms" },
        "2": { "name": "RATE_LOCATION", "value": 5, "localized_name": "Location" },
        "3": { "name": "RATE_CLEANLINESS", "value": 5, "localized_name": "Cleanliness" },
        "4": { "name": "RATE_SERVICE", "value": 5, "localized_name": "Service" },
        "5": { "name": "RATE_SLEEP", "value": 5, "localized_name": "Sleep Quality" }
      },
      "owner_response": {
        "id": 1050383976,
        "title": "Owner response",
        "text": "Dear Tcitterio\nThank you very much for taking the time to leave a review...",
        "lang": "en",
        "author": "Reputation Management Department",
        "published_date": "2026-02-20T11:00:16Z"
      }
    }
  ]
}
```

**German review example (same hotel):**
```json
{
  "id": 1046037653,
  "lang": "de",
  "text": "Ein wundervolles Wochenende im Baur au Lac.\nTop Service, chickes Hotel in Top Zustand mit perfektem Service und Kulinarik",
  "title": "Hotel der Extraklasse",
  "trip_type": "Familie",
  "owner_response": {
    "text": "Sehr geehrte*r BEko2010\nVielen Dank, dass Sie sich die Zeit genommen haben...",
    "lang": "de",
    "author": "Reputation Management Department"
  }
}
```

**Japanese review example (Park Hyatt Tokyo, id=307368):**
```json
{
  "lang": "ja",
  "title": "改装後も素敵なホテル",
  "trip_type": null
}
```

---

## Location Photos Response

**Call:** `GET /location/196060/photos?language=en`

```json
{
  "data": [
    {
      "id": 751856552,
      "is_blessed": false,
      "caption": "Baur Au Lac Hotel Exterior",
      "published_date": "2024-07-10T23:26:34.039Z",
      "images": {
        "thumbnail": { "height": 50, "width": 50, "url": "https://media-cdn.tripadvisor.com/media/photo-t/2c/d0/6b/a8/baur-au-lac-hotel-exterior.jpg" },
        "small": { "height": 150, "width": 150, "url": "https://media-cdn.tripadvisor.com/media/photo-l/..." },
        "medium": { "height": 192, "width": 250, "url": "https://media-cdn.tripadvisor.com/media/photo-f/..." },
        "large": { "height": 423, "width": 550, "url": "https://media-cdn.tripadvisor.com/media/photo-s/..." },
        "original": { "height": 582, "width": 756, "url": "https://media-cdn.tripadvisor.com/media/photo-o/..." }
      },
      "album": "Hotel & Grounds",
      "source": { "name": "Management", "localized_name": "Management" }
    }
  ]
}
```

**Source types observed:** `"Management"`, `"Traveler"`, `"Expert"`
**Album types observed:** `"Hotel & Grounds"`, `"Dining"`, `"Room/Suite"`
