// Real Vivid Clinic patient reviews, sourced verbatim from the clinic's
// authorized Google Business Profile API import
// (repo root: `src/data/google-reviews.json`, 159 reviews, avg 5.0,
// imported 2026-08-27). Per README-reviews.md compliance rules: no
// fabricated, rewritten, or exaggerated review text — ever.
//
// `text` is an exact substring of the reviewer's original wording, trimmed
// to a clean sentence boundary for card display — never reworded, corrected,
// or paraphrased (typos and all). `role` is derived only from
// the procedure and, where the reviewer stated it themselves, their home
// country — never invented. Full reviews live at vivid.clinic/#reviews and
// on the clinic's Google listing (see `reviewUrl`).
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  rating: number;
  avatar: string;
  text: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "AbFvOqlyWDbF7DHVqSJjXpVIOS4Ta1kVOQc4mNNn3HEutSWSM7_Bif8_-5D7byEr7qaSQwJOFXRm",
    name: "Danna Valentina",
    role: "Rhinoplasty Patient",
    rating: 5,
    avatar:
      "https://lh3.googleusercontent.com/a-/ALV-UjWu-V7iy6J2SWmww9xg5ROWkz0WqXOtJfUmuryvXc1YtwCPT7lm=s120-c-rp-mo-br100",
    text: "After extensive research, I chose this clinic for my rhinoplasty in Turkey, and it was one of the best decisions I have ever made.",
  },
  {
    id: "AbFvOqkFMWgqp5zWgjCdJALgpd1aQaYM0prFDgXDN5PSzGcTNSVWkOly5l_5vd5KwtpcQDS1Etd_",
    name: "Azeem Qadeer",
    role: "Gynecomastia Patient",
    rating: 5,
    avatar:
      "https://lh3.googleusercontent.com/a/ACg8ocJcaHUheXihdEt1rPiu0qqHnh4T4meW4GEPEos5AMPaA9h2Uw=s120-c-rp-mo-br100",
    text: "I recently travelled abroad for gynecomastia surgery, and as someone travelling to a different country for the first time, I was honestly very skeptical and overwhelmed at the beginning.",
  },
  {
    id: "AbFvOqkc-m8pBBghZl9oZCsK2QveZqN-FyogcIMu5TU6zAEzLk87oQWOMTJaMkoUTLdsy89knPzL",
    name: "Hasan Basri Alan",
    role: "Hair Transplant Patient",
    rating: 5,
    avatar:
      "https://lh3.googleusercontent.com/a/ACg8ocJ37TWZOZp0p0h4RTVFfTexyK8CiwgFUhEo0b5aH7Lge2tGyg=s120-c-rp-mo-br100",
    text: "I had a hair transplant at Vivid Clinic and I am truly very happy with the results. From start to finish, the entire process was extremely professional and well-organized.",
  },
  {
    id: "AbFvOqmxYt2PY2Kor58QGrRMEcMqD8c2IWhleHTie8pkysncrqca1vIW1ktI2KTAAXk8xxv_-z0b6A",
    name: "Tristan Arviso",
    role: "Cosmetic Surgery Patient, USA",
    rating: 5,
    avatar:
      "https://lh3.googleusercontent.com/a-/ALV-UjVrOi_yCl9yas4Mkkl007csgAgBkl9eVBTBG5LRNF6KdeotUUaF=s120-c-rp-mo-br100",
    text: "I came from the US by myself and was honestly pretty skeptical about getting cosmetic surgery in Turkey. Those concerns disappeared as soon as I arrived.",
  },
  {
    id: "AbFvOqnj6trA900xmW9xiCtZjITdgB2bjegRE8CLHrlnmymB-5_H0fU1e9husH6ojcab6J4fjfvr",
    name: "Jose Jorge Garcia",
    role: "Dental Patient, Brazil",
    rating: 5,
    avatar:
      "https://lh3.googleusercontent.com/a/ACg8ocIT_0iaq4u7D87SVcr-teWCawIhc2S0QatFABpjvx2r0uAoTQ=s120-c-rp-mo-br100",
    text: "I m from Brazil, I found this clinic and I did my teeth in this clinic very happy with result, they were very quick and professional, special thanks Dr caner and my patient coordinator Mr kadir",
  },
  {
    id: "AbFvOqlaZNRbKsHuaDYaLEsESJaPxfp6D0UBBUgoGVI0kkxBe-PzCooYNUHC0OcfQV65iirS6b-ahg",
    name: "Michelle Cuvos",
    role: "Dental Patient",
    rating: 4,
    avatar:
      "https://lh3.googleusercontent.com/a-/ALV-UjWTxSUpbyRS_6BnadXQ2pNFEGZHskV0HT1WHxIy1KvsCUqhL2j4=s120-c-rp-mo-br100",
    text: "Me and my friends went for a teeth cleaning and teeth laser whitening. The coordinator picked us up from our hotel room and all of us were catered with excellent service.",
  },
  {
    id: "AbFvOqmIzxlx9t-FHrHnV-egVVCFyFYtDvZ4WcsERnwzfzWDI0cMhNBQU3jQJuCl_6egoCBk_2oGSg",
    name: "Stefano C.",
    role: "Surgical Patient",
    rating: 5,
    avatar:
      "https://lh3.googleusercontent.com/a-/ALV-UjU0LJYmngNCD1hJZZc_mpUin_49VM2BQjDJjTGea8yW_kNSENM=s120-c-rp-mo-ba12-br100",
    text: "An amazing clinic for almost any medical procedure. From initial consultation through my surgical revision and follow-up, this is really the best opportunity for affordable surgical procedures in a five-star setting.",
  },
  {
    id: "AbFvOqlyX4_qCfe9p4g2kW75TQ5pJ7Q5b_kLbZAs8bfC2EH9jnoG3vDPnsNmdnLq4LtmuzN9BMu-UQ",
    name: "Alexandru Dinica",
    role: "Surgery Patient",
    rating: 5,
    avatar:
      "https://lh3.googleusercontent.com/a-/ALV-UjXbLFOtuV9AJU1weL9rIjTu19YlVbwyaGZUAQqx_Hm4bPLk9s5X=s120-c-rp-mo-br100",
    text: "I am extremely satisfied with my surgery and the overall experience at Memorial Bahçelievler Hospital. The medical staff were outstanding — professional, caring, and attentive throughout the entire process.",
  },
  {
    id: "AbFvOqlc0lPiUiHMeEAdLI5UlYySaFAYit4eEtw184D5Sj8A63a2-GS-87bDH-7mb9WTeurGTnkwkg",
    name: "Çetin Yünaçtı",
    role: "Gynecomastia Patient",
    rating: 5,
    avatar:
      "https://lh3.googleusercontent.com/a/ACg8ocKyLSAcwJRwvQ401adinW5DfQVisqsjJpaz73POH4l46BgyLQ=s120-c-rp-mo-br100",
    text: "I had my gynecomastia surgery with Dr. Erkan Yüce and I couldn't be happier with the whole experience. From the very first consultation, Dr. Erkan explained everything clearly and made me feel comfortable and confident about the procedure.",
  },
];

export const firstColumn = testimonials.slice(0, 3);
export const secondColumn = testimonials.slice(3, 6);
export const thirdColumn = testimonials.slice(6, 9);
