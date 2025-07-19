/* ON-DEMAND PRICING */

/*
sources:

https://console.runpod.io/deploy
https://hotaisle.xyz/pricing/
https://amd.digitalocean.com/
*/
export const MI300X_PRICING = [
  {
    provider: "RunPod",
    on_demand_dollar_per_gpu_hour: 2.69,
  },
  {
    provider: "Hot  Aisle",
    on_demand_dollar_per_gpu_hour: 1.99,
  },
  {
    provider: "DigitalOcean",
    on_demand_dollar_per_gpu_hour: 1.99,
  }
];

/*
sources:

https://www.thundercompute.com/blog/nvidia-h100-pricing
*/
export const H100_PRICING = [
  {
    provider: "AWS",
    on_demand_dollar_per_gpu_hour: 6.75,
  },
  {
    provider: "Azure",
    on_demand_dollar_per_gpu_hour: 6.98,
  },
  {
    provider: "Google Cloud",
    on_demand_dollar_per_gpu_hour: 11.06,
  },
  {
    provider: "Oracle Cloud",
    on_demand_dollar_per_gpu_hour: 2.98,
  },
  {
    provider: "Lambda Labs",
    on_demand_dollar_per_gpu_hour: 2.99,
  },
  {
    provider: "CoreWeave",
    on_demand_dollar_per_gpu_hour: 6.16,
  },
  {
    provider: "Paperspace",
    on_demand_dollar_per_gpu_hour: 5.95,
  },
  {
    provider: "RunPod",
    on_demand_dollar_per_gpu_hour: 1.99,
  },
  {
    provider: "Vast.ai",
    on_demand_dollar_per_gpu_hour: 1.65,
  }
];


/*
source:

https://www.thundercompute.com/blog/a100-gpu-pricing-showdown-2025-who-s-the-cheapest-for-deep-learning-workloads
*/
export const A100_PRICING = [
  {
    provider: "Thunder Compute",
    on_demand_dollar_per_gpu_hour: 0.66,
  },
  {
    provider: "RunPod",
    on_demand_dollar_per_gpu_hour: 1.19,
  },
  {
    provider: "Vast.ai",
    on_demand_dollar_per_gpu_hour: 1.27,
  },
  {
    provider: "Lambda Labs",
    on_demand_dollar_per_gpu_hour: 1.29,
  },
  {
    provider: "Paperspace",
    on_demand_dollar_per_gpu_hour: 3.09,
  },
  {
    provider: "Azure",
    on_demand_dollar_per_gpu_hour: 3.40,
  },
  {
    provider: "AWS",
    on_demand_dollar_per_gpu_hour: 3.02,
  },
  {
    provider: "Google Cloud",
    on_demand_dollar_per_gpu_hour: 4.27,
  }
];
