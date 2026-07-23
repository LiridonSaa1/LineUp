import { useState } from 'react';
import { PlaceDetails } from '../components/AddressAutocomplete';

export function useAddressAutocomplete(initialAddress: string = "") {
  const [addressData, setAddressData] = useState<PlaceDetails>({
    formatted_address: initialAddress,
    city: "",
    street: "",
    postal_code: "",
    country: "",
    latitude: undefined,
    longitude: undefined,
  });

  const handleSelectAddress = (place: PlaceDetails) => {
    setAddressData(place);
  };

  return {
    addressData,
    setAddressData,
    handleSelectAddress,
    city: addressData.city,
    street: addressData.street,
    formattedAddress: addressData.formatted_address,
    postalCode: addressData.postal_code,
    country: addressData.country,
    latitude: addressData.latitude,
    longitude: addressData.longitude,
  };
}
