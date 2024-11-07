import { Injectable } from '@angular/core';

const PINATA_CONFIG = {
  gateway: "green-electoral-cuckoo-639.mypinata.cloud",
  jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjMjkyZmVlMi05MDQxLTQ5ZmMtYjFkYi05NTM0Njg4NTA1NmQiLCJlbWFpbCI6ImtlaWRzb25kZXZAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjUxMjE2M2FjYjdkNWRjYjQxOWNlIiwic2NvcGVkS2V5U2VjcmV0IjoiYmUwM2Q2MWQ3M2UyN2MwMzJhOTE4N2EwYzU1MjFjM2Y3MWQ3YzllNDgxOGEwOGNjNzQ5NzYzZTIxY2ExYzNiNiIsImV4cCI6MTc2MDkyMjYzNH0.7Menu0s7Tk5xhNtg4QXPC9Nx_WO4DEVzBRlU8z8udr4"
};

@Injectable({
  providedIn: 'root'
})
export class PinataService {
  private baseUrl = `https://${PINATA_CONFIG.gateway}`;

  async uploadAudio(file: File): Promise<{ path: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PINATA_CONFIG.jwt}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload to Pinata');

      const data = await response.json();
      return { path: data.IpfsHash };
    } catch (error) {
      console.error('Error uploading to Pinata:', error);
      throw error;
    }
  }

  getAudioUrl(path: string): string {
    return `${this.baseUrl}/ipfs/${path}`;
  }
}