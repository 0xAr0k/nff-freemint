import { Hono } from "hono";
import { apiKeyMiddleware } from "../middlewares/api-key";
import { validator } from "hono/validator";
import { schema } from "../utils/validation";
import { nftOwnerQuerySchema } from "../params/nfts";
import { logger } from "../logger";
import { Address, erc721Abi } from "viem";
import { badRequest, ok } from "../utils/response";

const app = new Hono();

app.get(
  "/",
  apiKeyMiddleware(),
  validator("query", schema(nftOwnerQuerySchema)),
  async (c) => {
    try {
      const { address } = c.req.valid("query");
      const client = c.get("client");

      const contractAddress = c.get("env").CONTRACT_ADDRESS;

      logger.debug(`Getting NFT balance for ${address}`);

      const balance = await client.readContract({
        address: contractAddress as Address,
        abi: erc721Abi,
        functionName: "balanceOf",
        args: [address as Address],
      });

      if (balance === 0n) {
        return ok(c, {
          address,
          balance: "0",
          tokenIds: [],
        });
      }

      const totalSupply = await client.readContract({
        address: contractAddress as Address,
        abi: erc721Abi,
        functionName: "totalSupply",
      });

      const startTokenId = 1n;
      const tokenIdsToCheck = Array.from(
        { length: Number(totalSupply - startTokenId + 1n) },
        (_, i) => startTokenId + BigInt(i)
      );

      const results = await client.multicall({
        contracts: tokenIdsToCheck.map((tokenId) => ({
          address: contractAddress as Address,
          abi: erc721Abi,
          functionName: "ownerOf",
          args: [tokenId],
        })),
        allowFailure: true,
      });

      const tokenIds = results
        .map((result, index) => ({
          tokenId: tokenIdsToCheck[index],
          owner:
            result.status === "success" ? (result.result as Address) : null,
        }))
        .filter(
          ({ owner }) =>
            owner !== null && owner.toLowerCase() === address.toLowerCase()
        )
        .map(({ tokenId }) => tokenId.toString());

      logger.info(`Tokens retrieved, ${address} owner of ${tokenIds}`);

      return ok(c, {
        address,
        balance: balance.toString(),
        tokenIds,
      });
    } catch (error) {
      logger.error(`Failed to get tokens of owner: ${error}`);
      return badRequest(c, {
        message: "Failed to get tokens of owner",
      });
    }
  }
);

export default app;
