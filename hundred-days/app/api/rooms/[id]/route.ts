import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const BUCKET_NAME = "challenge-photos";

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const { id } = await context.params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { data: challenge, error: challengeError } =
    await supabase
      .from("challenges")
      .select("id, owner_id")
      .eq("id", id)
      .single();

  if (challengeError || !challenge) {
    return NextResponse.json(
      { error: "Room not found" },
      { status: 404 },
    );
  }

  if (challenge.owner_id !== user.id) {
    return NextResponse.json(
      { error: "Only the owner can delete this room" },
      { status: 403 },
    );
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 1. Room에 연결된 Storage 파일 목록을 가져온다.
  const filePaths: string[] = [];

  const { data: memberFolders, error: listMembersError } =
    await admin.storage
      .from(BUCKET_NAME)
      .list(id, {
        limit: 1000,
      });

  if (listMembersError) {
    console.error("LIST ROOM STORAGE ERROR:", listMembersError);

    return NextResponse.json(
      { error: "Room 사진을 확인하는 중 문제가 발생했습니다." },
      { status: 500 },
    );
  }

  // 2. 각 member 폴더 안의 파일을 찾는다.
  for (const folder of memberFolders ?? []) {
    const memberPath = `${id}/${folder.name}`;

    const { data: files, error: listFilesError } =
      await admin.storage
        .from(BUCKET_NAME)
        .list(memberPath, {
          limit: 1000,
        });

    if (listFilesError) {
      console.error(
        "LIST MEMBER STORAGE ERROR:",
        listFilesError,
      );

      return NextResponse.json(
        {
          error:
            "Room 사진을 확인하는 중 문제가 발생했습니다.",
        },
        { status: 500 },
      );
    }

    for (const file of files ?? []) {
      if (file.name) {
        filePaths.push(`${memberPath}/${file.name}`);
      }
    }
  }

  // 3. Storage 파일 삭제
  if (filePaths.length > 0) {
    for (let i = 0; i < filePaths.length; i += 100) {
      const batch = filePaths.slice(i, i + 100);

      const { error: removeError } = await admin.storage
        .from(BUCKET_NAME)
        .remove(batch);

      if (removeError) {
        console.error("REMOVE ROOM STORAGE ERROR:", removeError);

        return NextResponse.json(
          {
            error:
              "Room 사진을 삭제하는 중 문제가 발생했습니다.",
          },
          { status: 500 },
        );
      }
    }
  }

  // 4. DB Room 삭제
  const { error: deleteError } = await supabase
    .from("challenges")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("DELETE ROOM ERROR:", deleteError);

    return NextResponse.json(
      {
        error:
          "사진은 삭제되었지만 Room 삭제에 실패했습니다.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
  });
}