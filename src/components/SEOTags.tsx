import * as React from "react";

export const TitleSEOTag = ({ title }: { title: string }) =>
  title
    ? [
        <title key={`title-${title}`}>
          {title.includes("Fastbench") ? title : `${title} | Fastbench`}
        </title>,
        <meta key={`title-${title}-og`} property="og:title" content={title} />,
        <meta
          key={`title-${title}-twitter`}
          name="twitter:title"
          content={title}
        />,
      ]
    : [];

export const ImageSEOTag = ({
  url,
  width,
  height,
}: {
  url: string;
  width: number;
  height: number;
}) => [
  <meta
    key={`og:image:width-${url}`}
    property="og:image:width"
    content={`${width}`}
  />,
  <meta
    key={`og:image:height-${url}`}
    property="og:image:height"
    content={`${height}`}
  />,
  <meta
    key={`og:image:type-${url}`}
    property="og:image:type"
    content="image/png"
  />,
  <meta key={`og:image:url-${url}`} property="og:image:url" content={url} />,
  <meta
    key={`twitter:card"-${url}`}
    name="twitter:card"
    content="summary_large_image"
  />,
  <meta
    key={`twitter:image"-${url}`}
    name="twitter:image"
    content={url}
  ></meta>,
];

export const DescriptionSEOTag = ({ description }) =>
  description
    ? [
        <meta
          key={`name="description"-${description}`}
          name="description"
          content={description}
        />,
        <meta
          key={`property="og:description-${description}`}
          property="og:description"
          content={description}
        />,
        <meta
          key={`name="twitter:description-${description}`}
          name="twitter:description"
          content={description}
        />,
      ]
    : [];

export const ProfileSEOTag = ({ gender, username }) => {
  const _tags = [];

  if (gender) {
    _tags.push(
      <meta
        name="og:profile:gender"
        property={gender}
        key={`og:gender=${gender}`}
      />
    );
  }

  if (username) {
    _tags.push(
      <meta
        name="og:profile:username"
        property={username}
        key={`og:username=${username}`}
      />
    );
  }

  if (_tags.length === 0) {
    return _tags;
  } else {
    _tags.unshift(
      <meta name="og:type" property="profile" key="og:type=profile" />
    );
    return _tags;
  }
};

export const URLSEOTag = ({ url }) =>
  url
    ? [
        <meta key={`name="og:url"-${url}`} name="og:url" content={url} />,
        <link rel="canonical" href={url} key={`canonical-url-${url}`} />,
      ]
    : [];
